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


(dh/defretrypolicy retry-policy
  {:retry-on Exception
   :backoff-ms [1500 30000 4.0]
   :max-retries 3
   :on-retry (fn [_ ex]
               (log/info ::retry (.getMessage ex)))})

(defn survey-definition
  [api-root headers-fn instance survey-id]
  (-> (dh/with-retry
        {:policy retry-policy}
        (-> (format "%s/orgs/%s/surveys/%s" api-root instance survey-id)
            (http.client/get* (merge http-client-req-defaults
                                     {:headers (headers-fn)
                                      :as :json}))))
      :body))

(defn form-instances* [headers-fn url]
  (let [http-opts (merge http-client-req-defaults
                         {:headers (headers-fn)
                          :as :json-string-keys})
        response (dh/with-retry
                   {:policy retry-policy}
                   (http.client/get* url http-opts))
        {{:strs [formInstances nextPageUrl]} :body} response]
    (lazy-cat formInstances
              (when-let [url nextPageUrl]
                (form-instances* headers-fn url)))))

(defn form-instances
  "Returns a lazy sequence of form instances"
  [headers-fn form]
  (form-instances* headers-fn (:formInstancesUrl form)))

(defn data-points*
  [headers-fn url]
  (-> (dh/with-retry
        {:policy retry-policy}
        (http.client/get* url (merge http-client-req-defaults
                                     {:headers (headers-fn)
                                      :as :json-string-keys})))
      :body))

(defn data-points
  "Returns all survey data points"
  [headers-fn survey]
  (loop [all-data-points []
         response (data-points* headers-fn (:dataPointsUrl survey))]
    (if-let [url (get response "nextPageUrl")]
      (recur (into all-data-points (get response "dataPoints"))
             (data-points* headers-fn url))
      (into all-data-points (get response "dataPoints")))))

(defn questions
  "Get the list of questions from a form"
  [form]
  (->> (:questionGroups form)
       (reduce #(into % (map (fn [q* [group-id group-name]]
                               (assoc q* :groupId group-id :groupName group-name))
                             (:questions %2) (repeat [(:id %2) (str/trim (:name %2))]))) [])))

(defn form
  "Get a form by id from a survey"
  [survey form-id]
  (let [form (or (first (filter #(= form-id (:id %)) (:forms survey)))
                 (throw (ex-info "No such form"
                                 {:form-id form-id
                                  :survey-id (:id survey)})))]
    (assoc form
           :registration-form? (= form-id (:registrationFormId survey)))))

(defn rqg-responses [rqg]
  (->> rqg
       (reduce (fn [c i]
                 (reduce (fn [x [k v]]
                           (update x k conj v)) c i)) {})
       ;; we need to reverse the values thus conj includes, and also convert to vector so collection was more json-friendly
       (reduce (fn [c [k v]] (assoc c k (vec (reverse v))) ) {})))

(defn not-rqg? [row-group-data]
  (= 1 (count row-group-data)))

;; Transforms the structure
;; {question-group-id -> [{question-id -> response}]
;; to
;; {question-id -> first-response}
(defn question-responses
  "Returns a map from question-id to the first response iteration"
  [responses]
  (->> (vals responses)
       (map #(if (not-rqg? %)
               (first %)
               (rqg-responses %)))
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
