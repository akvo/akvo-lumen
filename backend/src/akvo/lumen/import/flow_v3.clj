(ns akvo.lumen.import.flow-v3
  (:require [akvo.lumen.import.common :as import]
            [akvo.lumen.import.flow-common :as flow-common]
            [akvo.lumen.import.flow-v2 :as v2]
            [akvo.lumen.caddisfly :as caddisfly]
            [clojure.walk :refer (keywordize-keys)]
            [clojure.tools.logging :as log])
  (:import [java.time Instant]))

(defn question-type->lumen-type
  [question]
  (condp = (:type question)
    "NUMBER" :number
    "DATE" :date
    "GEO" :geopoint
    :text))

(defn kw-child-id-fun [parent-id]
  (fn [id*]
    (keyword (format "c%s%s" parent-id id*))))

(defn kw-id [id*] (keyword (format "c%s" id*)))

(defn question->columns
  "a question could reflect several columns/values. Example: caddisfly values.
  Column ids are generated based in question ids and childs option"
  [{:keys [name id caddisflyResourceUuid] :as q}]
  (let [column {:title name
                :type  (question-type->lumen-type q)
                :id    id}]
    (if caddisflyResourceUuid
      (->> (caddisfly/child-questions column caddisflyResourceUuid)
           (map #(update % :id (kw-child-id-fun id))))
      [(update column :id kw-id)])))

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
          (reduce #(apply conj % (question->columns %2)) [] questions))))

(defn render-response
  [type response]
  (if (= type "GEO")
    (let [{:strs [long lat]} response]
      (when (and long lat)
        (import/->Geopoint
         (format "POINT (%s %s)" long lat))))
    (v2/render-response type response)))

(defn response->columns
  "returns a vector of tuples of columns reponses [id1 r1 id2 r2 ...]"
  [{:keys [type id caddisflyResourceUuid] :as q} response]
  (if caddisflyResourceUuid
    (caddisfly/child-responses (kw-child-id-fun id) response)
    [(kw-id id) (render-response type response)]))

(defn response-data
  [form responses]
  (let [question-responses (flow-common/question-responses responses)]
    (reduce
     (fn [map* {:keys [type id caddisflyResourceUuid] :as q}]
       (apply assoc map* (response->columns q (get question-responses (:id q)))))
     {}
     (filter #(get question-responses (:id %)) (flow-common/questions form)))))

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
