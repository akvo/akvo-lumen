(ns akvo.lumen.import.flow-v3
  (:require [akvo.lumen.import.common :as import]
            [akvo.lumen.import.flow-common :as flow-common]
            [akvo.lumen.import.flow-v2 :as v2]
            [cheshire.core :as json]
            [clojure.walk :refer (keywordize-keys)]
            [clojure.tools.logging :as log]
            [clojure.java.io :as io])
  (:import [java.time Instant]))

(defn question-type->lumen-type
  [question]
  (condp = (:type question)
    "NUMBER" :number
    "DATE" :date
    "GEO" :geopoint
    :text))

(def parse-json #(json/parse-string (slurp (io/resource %)) keyword))

(def schemas (->> (:tests (parse-json "./caddisfly/tests-schema.json"))
                  (reduce #(assoc % (:uuid %2) %2) {})))

(defn add-new-columns [col* q]
  (reduce #(conj % (assoc q
                          :title (str (:title q) "|" (:name %2) "|" (:unit %2))
                          :id  (keyword (str (name (:id q)) (:id %2))))) col*
          (:results (get schemas (:caddisflyResourceUuid q)))))

(add-new-columns [] {:title "Fluoride", :type :text, :id :c110249115, :caddisflyResourceUuid "f0f3c1dd-89af-49f1-83e7-bcc31c3006cf"})

(defn dataset-columns
  [form version]
  (let [questions (flow-common/questions form)]
    (into [{:title "Instance id" :type :text :id :instance_id :key true}
           (let [identifier {:title "Identifier" :type :text :id :identifier}]
             (if (:registration-form? form)
               (assoc identifier :key true)
               identifier))
           {:title "Display name" :type :text :id :display_name}
           {:title "Submitter" :type :text :id :submitter}
           {:title "Submitted at" :type :date :id :submitted_at}
           {:title "Surveyal time" :type :number :id :surveyal_time}]
          (->> questions
               (map (fn [q]
                      {:title (:name q)
                       :type (question-type->lumen-type q)
                       :id (keyword (format "c%s" (:id q)))
                       :caddisflyResourceUuid (:caddisflyResourceUuid q)}))
               (reduce (fn [c q]
                         (if-not (:caddisflyResourceUuid q)
                           (conj c q)
                           (add-new-columns c q))) [])))))

(defn render-response
  [type response]
  (if (= type "GEO")
    (let [{:strs [long lat]} response]
      (when (and long lat)
        (import/->Geopoint
         (format "POINT (%s %s)" long lat))))
    (v2/render-response type response)))

(defn response-data
  [form responses]
  (let [responses (flow-common/question-responses responses)]
    (reduce (fn [response-data {:keys [type id caddisflyResourceUuid] :as q}]
               (if-let [response (get responses id)]
                (if-not caddisflyResourceUuid
                  (assoc response-data (keyword (format "c%s" id))
                         (render-response type response))
                  (reduce
                   (fn [map* r]
                     (assoc map* (keyword (format "c%s%s" id (:id r)))
                            (:value r)))
                   response-data
                   (:result (keywordize-keys response))))
                response-data))
            {}
            (flow-common/questions form))))

(defn form-data
  "First pulls all data-points belonging to the survey. Then map over all form
  instances and pulls additional data-point data using the forms data-point-id."
  [headers-fn survey form-id]
  (let [form (flow-common/form survey form-id)
        data-points (flow-common/index-by
                     "id" (flow-common/data-points headers-fn survey))]
    (map (fn [form-instance]
           (let [data-point-id (get form-instance "dataPointId")]
             (if-let [data-point (get data-points data-point-id)]
               (assoc (response-data form (get form-instance "responses"))
                      :instance_id (get form-instance "id")
                      :display_name (get data-point "displayName")
                      :identifier (get data-point "identifier")
                      :submitter (get form-instance "submitter")
                      :submitted_at (some-> (get form-instance "submissionDate")
                                            Instant/parse)
                      :surveyal_time (get form-instance "surveyalTime"))
               (throw (ex-info "Flow form (dataPointId) referenced data point not in survey"
                               {:form-instance-id (get form-instance "id")
                                :data-point-id data-point-id
                                :survey-id (:id survey)})))))
         (flow-common/form-instances headers-fn form))))
