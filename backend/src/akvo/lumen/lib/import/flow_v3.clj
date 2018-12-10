(ns akvo.lumen.lib.import.flow-v3
  (:require
   [akvo.lumen.lib.import.common :as common]
   [akvo.lumen.lib.import.flow-common :as flow-common]
   [akvo.lumen.lib.import.flow-v2 :as v2]
   [akvo.lumen.postgres :as postgres]
   [akvo.lumen.util :as util])
  (:import [java.time Instant]))

(defn question-type->lumen-type
  [question]
  (condp = (:type question)
    "NUMBER" :number
    "DATE" :date
    "GEO" :geopoint
    "CADDISFLY" :multiple
    :text))

(defn dataset-columns
  "returns a vector of [{:title :type :id :key}]
  `key` is optional"
  [form]
  (let [questions (flow-common/questions form)]
    (into (flow-common/commons-columns form)
          (into [{:title "Device Id" :type :text :id :device_id}]
                (->> (flow-common/questions form)
                     (common/coerce question-type->lumen-type))))))

(defn render-response
  [type response]
  (if (= type "GEO")
    (let [{:strs [long lat]} response]
      (when (and long lat)
        (postgres/->Geopoint
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
  "First pulls all data-points belonging to the survey. Then map over all form
  instances and pulls additional data-point data using the forms data-point-id."
  [headers-fn instance survey form-id]
  (let [form (flow-common/form survey form-id)
        data-points (util/index-by
                     "id" (flow-common/data-points headers-fn survey))]
    (map (fn [form-instance]
           (let [data-point-id (get form-instance "dataPointId")]
             (if-let [data-point (get data-points data-point-id)]
               (assoc (response-data form (get form-instance "responses"))
                      :instance_id (get form-instance "id")
                      :display_name (get data-point "displayName")
                      :device_id (get form-instance "deviceIdentifier")
                      :identifier (get data-point "identifier")
                      :submitter (get form-instance "submitter")
                      :submitted_at (some-> (get form-instance "submissionDate")
                                            Instant/parse)
                      :surveyal_time (get form-instance "surveyalTime"))
               (throw (ex-info "Flow form (dataPointId) referenced data point not in survey"
                               {:data-point-id data-point-id
                                :form-instance-id (get form-instance "id")
                                :flow-instance instance
                                :survey-id (:id survey)})))))
         (flow-common/form-instances headers-fn form))))
