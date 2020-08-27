(ns akvo.lumen.lib.import.flow-common
  (:require
   [akvo.commons.psql-util :as pg]
   [akvo.lumen.util :as u]
   [akvo.lumen.lib.import.common :as common]
   [akvo.lumen.http.client :as http.client]
   [cheshire.core :as json]
   [clojure.java.jdbc :as jdbc]
   [clojure.set :as set]
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

(defn question-type->lumen-type
  [environment question]
  (condp = (:type question)
              "NUMBER" "number"
              "DATE" "date"
              "GEO" "geopoint"
              "GEOSHAPE" "geoshape"
              "GEO-SHAPE-FEATURES" "multiple"
              "CADDISFLY" "multiple"
              "OPTION" "option"
              "text"))

(defn questions
  "Get the list of questions from a form"
  [form]
  (->> (:questionGroups form)
       (reduce #(into % (map (fn [q* [group-id group-name repeatable]]
                               (let [ns (if repeatable group-id "main")]
                                 (assoc q* :groupId group-id :groupName group-name :namespace ns)))
                             (:questions %2) (repeat [(:id %2) (str/trim (:name %2)) (:repeatable %2)]))) [])))

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
(defn- question-responses-base [responses]
  (->> responses
       vals
       (map first)
       (apply merge)))

;; Transforms the structure
;; {question-group-id -> [{question-id -> response}]
;; to
;; [(with-meta
;;          {question-id -> first-response}
;;          {:namespace xxx})]
(defn question-responses
  "Returns a list of maps with meta from question-id to the first response iteration"
  [groups responses]
  (let [dict (let [[rep-col non-rep-col] (u/split-with-non-stop :repeatable groups)]
               {:rqg-ns (set (map :id rep-col)) :main-ns (set (map :id non-rep-col))})]
    (into [(with-meta
             (question-responses-base (select-keys responses (:main-ns dict)))
             {:namespace "main"})]
          (mapv #(with-meta
                    (or (question-responses-base {% (get responses %)}) {})
                     {:namespace %})
                (:rqg-ns dict)))))

(def metadata-keys #{"identifier" "instance_id" "display_name" "submitter" "submitted_at" "surveyal_time" "device_id"})

(defn commons-columns [form]
  (->> [(cond-> {:title "Identifier" :type "text" :id "identifier"}
          (:registration-form? form) (assoc :key true))
        {:title "Instance id" :type "text" :id "instance_id" :key true}
        {:title "Display name" :type "text" :id "display_name"}
        {:title "Submitter" :type "text" :id "submitter"}
        {:title "Submitted at" :type "date" :id "submitted_at"}
        {:title "Surveyal time" :type "number" :id "surveyal_time"}]
       (mapv #(assoc % :groupName "metadata" :groupId "metadata"))))

(defn common-records [form-instance data-point]
  {:instance_id   (get form-instance "id")
   :display_name  (get data-point "displayName")
   :identifier    (get data-point "identifier")
   :submitter     (get form-instance "submitter")
   :submitted_at  (some-> (get form-instance "submissionDate") Instant/parse)
   :surveyal_time (get form-instance "surveyalTime")})
