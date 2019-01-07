(ns akvo.lumen.lib.import.flow-v3
  (:require [akvo.lumen.postgres :as postgres]
            [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.util :as util]
            [akvo.lumen.lib.import.flow-common :as flow-common]
            [akvo.lumen.lib.import.flow-v2 :as v2])
  (:import [java.time Instant]))

(defn question-type->lumen-type
  [question]
  (condp = (:type question)
    "NUMBER" "number"
    "DATE" "date"
    "GEO" "geopoint"
    "CADDISFLY" "multiple"
    "text"))

(defn dataset-columns
  "returns a vector of [{:title :type :id :key}]
  `:key` is optional"
  [form]
  (into (flow-common/commons-columns form)
        (into [{:title "Device Id" :type "text" :id :device_id}]
              (common/coerce question-type->lumen-type (flow-common/questions form)))))

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
                       (format "c%s" id)
                       (render-response type response))
                response-data))
            {}
            (flow-common/questions form))))

(defn form-data
  "First pulls all data-points belonging to the survey. Then map over all form
  instances and pulls additional data-point data using the forms data-point-id."
  [headers-fn survey form-id]
  (let [form (flow-common/form survey form-id)
        data-points (util/index-by
                     "id" (flow-common/data-points headers-fn survey))]
    (map (fn [form-instance]
           (let [data-point-id (get form-instance "dataPointId")]
             (if-let [data-point (get data-points data-point-id)]
               (merge (response-data form (get form-instance "responses"))
                      (flow-common/common-records form-instance data-point)
                      {:device_id (get form-instance "deviceIdentifier")})
               (throw (ex-info "Flow form (dataPointId) referenced data point not in survey"
                               {:form-instance-id (get form-instance "id")
                                :data-point-id data-point-id
                                :survey-id (:id survey)})))))
         (flow-common/form-instances headers-fn form))))
