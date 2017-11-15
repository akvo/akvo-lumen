(ns akvo.lumen.import.flow-v3
  (:require [akvo.lumen.import.common :as import]
            [akvo.lumen.import.flow-common :as flow-common]
            [akvo.lumen.import.flow-v2 :as v2])
  (:import [java.time Instant]))

(defn question-type->lumen-type
  [question]
  (condp = (:type question)
    "NUMBER" :number
    "DATE" :date
    "GEO" :geopoint
    :text))

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
          (map (fn [question]
                 {:title (:name question)
                  :type (question-type->lumen-type question)
                  :id (keyword (format "c%s" (:id question)))})
               questions))))

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
    (reduce (fn [response-data {:keys [type id]}]
              (if-let [response (get responses id)]
                (assoc response-data
                       (keyword (format "c%s" id))
                       (render-response type response))
                response-data))
            {}
            (flow-common/questions form))))

(defn form-data
  ""
  [headers-fn survey form-id]
  (let [form (flow-common/form survey form-id)
        data-points (flow-common/index-by "id" (flow-common/data-points headers-fn
                                                                        survey))]
    (map (fn [form-instance]
           (let [data-point-id (get form-instance "dataPointId")]
             (assoc (response-data form (get form-instance "responses"))
                    :instance_id (get form-instance "id")
                    :display_name (get-in data-points [data-point-id "displayName"])
                    :identifier (get-in data-points [data-point-id "identifier"])
                    :submitter (get form-instance "submitter")
                    :submitted_at (some-> (get form-instance "submissionDate")
                                          Instant/parse)
                    :surveyal_time (get form-instance "surveyalTime"))))
         (flow-common/form-instances headers-fn form))))
