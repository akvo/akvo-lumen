(ns akvo.lumen.import.flow
  (:require [akvo.commons.psql-util :as pg]
            [akvo.lumen.import.common :as import]
            [cheshire.core :as json]
            [clj-http.client :as http]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str])
  (:import [java.time Instant]))

(defn index-by
  [key coll]
  (reduce (fn [index item]
            (assoc index (get item key) item))
          {}
          coll))

(defn access-token
  "Fetch a new access token using a refresh token"
  [token-endpoint refresh-token]
  (-> (http/post token-endpoint
                 {:form-params {"client_id" "akvo-lumen"
                                "refresh_token" refresh-token
                                "grant_type" "refresh_token"}
                  :as :json})
      :body
      :access_token))

(defn flow-api-headers
  [token-endpoint refresh-token]
  {"Authorization" (format "Bearer %s" (access-token token-endpoint refresh-token))
   "User-Agent" "lumen"
   "Accept" "application/vnd.akvo.flow.v2+json"
   "X-Akvo-Email" "akvo.flow.user.test2@gmail.com"})

(defn survey-definition
  [api-root headers-fn instance survey-id]
  (-> (format "%s/orgs/%s/surveys/%s"
              api-root instance survey-id)
      (http/get {:headers (headers-fn)
                 :as :json})
      :body))

(defn form-instances* [headers-fn url]
  (let [response (-> url
                     (http/get {:headers (headers-fn)
                                :as :json-string-keys})
                     :body)]
    (lazy-cat (get response "formInstances")
              (when-let [url (get response "nextPageUrl")]
                (form-instances* headers-fn url)))))

(defn form-instances
  "Returns a lazy sequence of form instances"
  [headers-fn form]
  (let [initial-url (str (:formInstancesUrl form) "&page_size=300")]
    (form-instances* headers-fn initial-url)))

(defn data-points*
  [headers-fn url]
  (-> url
      (http/get {:headers (headers-fn)
                 :as :json-string-keys})
      :body))

(defn data-points
  "Returns all survey data points"
  [headers-fn survey]
  (loop [all-data-points []
         response (data-points* headers-fn
                                (str (:dataPointsUrl survey)
                                     "&page_size=300"))]
    (if-let [url (get response "nextPageUrl")]
      (recur (into all-data-points (get response "dataPoints"))
             (data-points* headers-fn url))
      all-data-points)))

(defn question-type->lumen-type
  [question]
  (condp = (:type question)
    "NUMBER" :number
    "DATE" :date
    :text))

(defn questions
  "Get the list of questions from a form"
  [form]
  (mapcat :questions (:questionGroups form)))

(defn dataset-columns
  [form]
  (let [questions (questions form)]
    (into
     [{:title "Identifier" :type :text :id :identifier}
      {:title "Latitude" :type :number :id :latitude}
      {:title "Longitude" :type :number :id :longitude}
      {:title "Submitter" :type :text :id :submitter}
      {:title "Submitted at" :type :date :id :submitted_at}]
     (map (fn [question]
            {:title (:name question)
             :type (question-type->lumen-type question)
             :id (keyword (format "c%s" (:id question)))})
          questions))))

(defmulti render-response
  (fn [type response]
    type))

(defmethod render-response "DATE"
  [_ response]
  (Instant/parse response))

(defmethod render-response "FREE_TEXT"
  [_ response]
  response)

(defmethod render-response "NUMBER"
  [_ response]
  response)

(defmethod render-response "OPTION"
  [_ response]
  (str/join "|" (map (fn [{:strs [text code]}]
                       (if code
                         (str/join ":" [code text])
                         text))
                     response)))

(defmethod render-response "GEO"
  [_ response]
  (condp = (get-in response ["geometry" "type"])
    "Point" (let [coords (get-in response ["geometry" "coordinates"])]
              (str/join "," coords))
    nil))

(defmethod render-response "CASCADE"
  [_ response]
  (str/join "|" (map (fn [item]
                       (get item "name"))
                     response)))

(defmethod render-response "PHOTO"
  [_ response]
  (get response "filename"))

(defmethod render-response "VIDEO"
  [_ response]
  (get response "filename"))

(defmethod render-response "CADDISFLY"
  [_ response]
  (json/generate-string response))

(defmethod render-response :default
  [type response]
  nil)

(defn form
  "Get a form by id from a survey"
  [survey form-id]
  (or (first (filter #(= form-id (:id %)) (:forms survey)))
      (throw (ex-info "No such form"
                      {:form-id form-id
                       :survey-id (:id survey)}))))

;; Transforms the structure
;; {question-group-id -> [{question-id -> response}]
;; to
;; {question-id -> first-response}
(defn question-responses
  "Returns a map from question-id to the first response iteration"
  [responses]
  (->> (vals responses)
       (map first)
       (apply merge)))

(defn response-data
  [form responses]
  (let [responses (question-responses responses)]
    (reduce (fn [response-data {:keys [type id]}]
              (if-let [response (get responses id)]
                (assoc response-data
                       (keyword (format "c%s" id))
                       (render-response type response))
                response-data))
            {}
            (questions form))))

(defn form-data
  "Returns a lazy sequence of form data, ready to be inserted as a lumen dataset"
  [headers-fn survey form-id]
  (let [form (form survey form-id)
        data-points (index-by "id" (data-points headers-fn survey))]
    (map (fn [form-instance]
           (let [data-point-id (get form-instance "dataPointId")]
             (assoc (response-data form (get form-instance "responses"))
                    :identifier (get-in data-points [data-point-id "identifier"])
                    :latitude (get-in data-points [data-point-id "latitude"])
                    :longitude (get-in data-points [data-point-id "longitude"])
                    :submitter (get form-instance "submitter")
                    :submitted_at (some-> (get form-instance "submissionDate")
                                          Instant/parse))))
         (form-instances headers-fn form))))

(defmethod import/dataset-importer "AKVO_FLOW"
  [{:strs [instance surveyId formId refreshToken] :as spec}
   {:keys [flow-api-url keycloak-realm keycloak-url] :as config}]
  (let [token-endpoint (format "%s/realms/%s/protocol/openid-connect/token"
                               keycloak-url
                               keycloak-realm)
        headers-fn #(flow-api-headers token-endpoint refreshToken)
        survey (delay (survey-definition flow-api-url
                                         headers-fn
                                         instance
                                         surveyId))]
    (reify
      java.io.Closeable
      (close [this])
      import/DatasetImporter
      (columns [this]
        (dataset-columns (form @survey formId)))
      (records [this]
        (form-data headers-fn @survey formId)))))
