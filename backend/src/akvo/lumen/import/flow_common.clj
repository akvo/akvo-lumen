(ns akvo.lumen.import.flow-common
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

(defn questions
  "Get the list of questions from a form"
  [form]
  (mapcat :questions (:questionGroups form)))

(defn form
  "Get a form by id from a survey"
  [survey form-id]
  (let [form (or (first (filter #(= form-id (:id %)) (:forms survey)))
                 (throw (ex-info "No such form"
                                 {:form-id form-id
                                  :survey-id (:id survey)})))]
    (assoc form
           :registration-form? (= form-id (:registrationFormId survey)))))

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
