(ns akvo.lumen.lib.import.flow-common
  (:require
   [akvo.commons.psql-util :as pg]
   [akvo.lumen.http.client :as http.client]
   [cheshire.core :as json]
   [clojure.java.jdbc :as jdbc]
   [clojure.string :as str]
   [clojure.tools.logging :as log]
   [diehard.core :as dh])
  (:import [java.time Instant]))

;; only use this value from a different thread/future
(def ^:private http-client-req-defaults (http.client/req-opts 60000))

(def retry-policy
  {:retry-on Exception
   :delay-ms 5000
   :max-retries 6})

(defn survey-definition
  [api-root headers-fn instance survey-id]
  (dh/with-retry
    {:policy
     (assoc retry-policy
            :on-retry (fn [_ e]
                        (log/info ::survey-definition*-retry e))
            :on-success (fn [{:keys [body]}]
                          body))}
    (-> (format "%s/orgs/%s/surveys/%s" api-root instance survey-id)
        (http.client/get* (merge http-client-req-defaults
                                 {:headers (headers-fn)
                                  :as :json})))))

(defn form-instances* [headers-fn url]
  (dh/with-retry
    {:policy
     (assoc retry-policy
            :on-retry (fn [_ e]
                        (log/info ::form-instances*-retry e))
            :on-success (fn [{{:strs [formInstances nextPageUrl]} :body}]
                          (lazy-cat formInstances
                                    (when-let [url nextPageUrl]
                                      (form-instances* headers-fn url)))))}
    (http.client/get* url (merge http-client-req-defaults
                                 {:headers (headers-fn)
                                  :as :json-string-keys}))))

(defn form-instances
  "Returns a lazy sequence of form instances"
  [headers-fn form]
  (let [initial-url (str (:formInstancesUrl form) "&page_size=300")]
    (form-instances* headers-fn initial-url)))

(defn data-points*
  [headers-fn url]
  (dh/with-retry
    {:policy
     (assoc retry-policy
            :on-retry (fn [_ e]
                        (log/info ::data-points*-retry e))
            :on-success (fn [{:keys [body]}]
                          body))}
    (http.client/get* url (merge http-client-req-defaults
                                 {:headers (headers-fn)
                                  :as :json-string-keys}))))

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
      (into all-data-points (get response "dataPoints")))))

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

(defn commons-columns [form]
  [(cond-> {:title "Identifier" :type "text" :id "identifier"}
     (:registration-form? form) (assoc :key true))
   {:title "Instance id" :type "text" :id "instance_id" :key true}
   {:title "Display name" :type "text" :id "display_name"}
   {:title "Submitter" :type "text" :id "submitter"}
   {:title "Submitted at" :type "date" :id "submitted_at"}
   {:title "Surveyal time" :type "number" :id "surveyal_time"}])

(defn common-records [form-instance data-point]
  {:instance_id   (get form-instance "id")
   :display_name  (get data-point "displayName")
   :identifier    (get data-point "identifier")
   :submitter     (get form-instance "submitter")
   :submitted_at  (some-> (get form-instance "submissionDate") Instant/parse)
   :surveyal_time (get form-instance "surveyalTime")})
