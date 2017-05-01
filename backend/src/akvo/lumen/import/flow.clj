(ns akvo.lumen.import.flow
  (:require [akvo.commons.psql-util :as pg]
            [akvo.lumen.import.common :as import]
            [clj-http.client :as http]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [hugsql.core :as hugsql])
  (:import [java.sql Timestamp]
           [java.time Instant]))

(defn sql-timestamp
  [iso-8601-string]
  (-> iso-8601-string
      Instant/parse
      .toEpochMilli
      Timestamp.))

(defn index-by
  [key coll]
  (reduce (fn [index item]
            (assoc index (get item key) item))
          {}
          coll))

(defmethod import/valid? "AKVO_FLOW"
  [{:strs [instance surveyId formId refreshToken]}]
  (and (string? instance)
       (string? surveyId)
       (string? formId)
       (string? refreshToken)))

(defmethod import/authorized? "AKVO_FLOW"
  [claims {:keys []} {:strs [instance surveyId]}]
  true)

(defn access-token
  "Fetch a new access token using a refresh token"
  [refresh-token]
  (-> (http/post "https://kc.akvotest.org/auth/realms/akvo/protocol/openid-connect/token"
                 {:form-params {"client_id" "akvo-lumen"
                                "refresh_token" refresh-token
                                "grant_type" "refresh_token"}
                  :as :json})
      :body
      :access_token))

(defn offline-token
  [refresh-token]
  (-> (http/post "https://kc.akvotest.org/auth/realms/akvo/protocol/openid-connect/token"
                 {:form-params {"client_id" "akvo-lumen"
                                "refresh_token" refresh-token
                                "scope" "offline_access"
                                "grant_type" "refresh_token"}
                  :as :json})
      :body
      :refresh_token))

(defn flow-api-headers
  [refresh-token]
  {"Authorization" (format "Bearer %s" (access-token refresh-token))
   "User-Agent" "lumen"
   "Accept" "application/vnd.akvo.flow.v2+json"
   "X-Akvo-Email" "akvo.flow.user.test2@gmail.com"})

(defn survey-definition
  [api-root access-token instance survey-id]
  (-> (format "%s/orgs/%s/surveys/%s"
              api-root instance survey-id)
      (http/get {:headers (flow-api-headers access-token)
                 :as :json})
      :body))

(defn form-instances* [refresh-token url]
  (let [response (-> url
                     (http/get {:headers (flow-api-headers refresh-token)
                                :as :json-string-keys})
                     :body)]
    (lazy-cat (get response "formInstances")
              (when-let [url (get response "cursor")]
                (println "Fetching more")
                (form-instances* refresh-token url)))))

(defn form-instances
  "Returns a lazy sequence of form instances"
  [refresh-token form]
  (let [initial-url (str (:formInstancesUrl form) "?pageSize=300")]
    (form-instances* refresh-token initial-url)))

(defn data-points*
  [access-token url]
  (-> url
      (http/get {:headers (flow-api-headers access-token)
                 :as :json-string-keys})
      :body))

(defn data-points
  "Returns all survey data points"
  [refresh-token survey]
  (loop [all-data-points []
         response (data-points* (access-token refresh-token)
                                (str (:dataPointsUrl survey)
                                     "?pageSize=300"))]
    (if-let [url (get response "cursor")]
      (recur (into all-data-points (get response "dataPoints"))
             (data-points* (access-token refresh-token) url))
      all-data-points)))

(defn question-type->lumen-type
  [question]
  (condp = (:type question)
    "NUMBER" "number"
    "DATE" "date"
    "text"))

(defn questions
  "Get the list of questions from a form"
  [form]
  (mapcat :questions (:questionGroups form)))

(defn dataset-columns
  [form]
  (let [questions (questions form)]
    (into
     [{:title "Identifier" :type "text" :column-name "identifier"}
      {:title "Latitude" :type "number" :column-name "latitude"}
      {:title "Longitude" :type "number" :column-name "longitude"}
      {:title "Submitter" :type "text" :column-name "submitter"}
      {:title "Submitted at" :type "date" :column-name "submitted_at"}]
     (map (fn [question]
            {:title (:name question)
             :type (question-type->lumen-type question)
             :column-name (format "c%s" (:id question))})
          questions))))

(defn create-data-table
  [table-name columns]
  (format "create table %s (rnum serial primary key, %s);"
          table-name
          (str/join ", " (map (fn [{:keys [column-name type]}]
                                (format "%s %s"
                                        column-name
                                        (condp = type
                                          "date" "timestamptz"
                                          "number" "double precision"
                                          "text" "text")))
                              columns))))

(defmulti render-response
  (fn [type response]
    type))

(defmethod render-response "DATE"
  [_ response]
  (sql-timestamp response))

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

(defn response-data
  [form responses]
  (reduce (fn [response-data {:keys [type id]}]
            (if-let [response (get-in responses [id "0"])]
              (assoc response-data
                     (format "c%s" id)
                     (render-response type response))
              response-data))
          {}
          (questions form)))

(defn form-data
  "Returns a lazy sequence of form data, ready to be inserted as a lumen dataset"
  [refresh-token survey form-id]
  (let [form (form survey form-id)
        data-points (index-by "id" (data-points refresh-token survey))]
    (map (fn [form-instance]
           (let [data-point-id (get form-instance "dataPointId")]
             (assoc (response-data form (get form-instance "responses"))
                    "identifier" (get-in data-points [data-point-id "identifier"])
                    "latitude" (get-in data-points [data-point-id "latitude"])
                    "longitude" (get-in data-points [data-point-id "longitude"])
                    "submitter" (get form-instance "submitter")
                    "submitted_at" (some-> (get form-instance "submissionDate")
                                           sql-timestamp))))
         (form-instances refresh-token form))))

(defn create-dataset [tenant-conn refresh-token table-name survey form-id]
  (let [columns (dataset-columns (form survey form-id))
        data-rows (form-data refresh-token survey form-id)]
    (jdbc/execute! tenant-conn [(create-data-table table-name columns)])
    (doseq [data (partition-all 300 data-rows)]
      (jdbc/insert-multi! tenant-conn table-name data))
    columns))

(defmethod import/make-dataset-data-table "AKVO_FLOW"
  [tenant-conn {:keys [flow-api]} table-name {:strs [instance surveyId formId refreshToken]}]
  (try
    (let [api-root "https://api.akvotest.org/flow"
          refresh-token (offline-token refreshToken)]
      {:success? true
       :columns (let [survey (survey-definition api-root
                                                (access-token refresh-token)
                                                instance
                                                surveyId)]
                  (create-dataset tenant-conn
                                  refresh-token
                                  table-name
                                  survey
                                  formId))})
    (catch Exception e
      (.printStackTrace e)
      {:success? false
       :reason (str "Unexpected error " (.getMessage e))})))
