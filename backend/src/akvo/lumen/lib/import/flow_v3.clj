(ns akvo.lumen.lib.import.flow-v3
  (:require [akvo.lumen.postgres :as postgres]
            [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.util :as util]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [clojure.walk :as w]
            [akvo.lumen.lib.import.flow-common :as flow-common]
            [akvo.lumen.lib.import.flow-v2 :as v2])
  (:import [java.time Instant]))

(defn flow-questions [form]
  (reduce
   (fn [c  i]
     (if (= "GEOSHAPE" (:type i))
       (apply conj c (reduce #(conj % (let [id (str (:id i) "_" %2)]
                                        (->  i
                                             (assoc :type "GEO-SHAPE-FEATURES")
                                             (assoc :multipleType "geo-shape-features")
                                             (assoc :multipleId (:id i))
                                             (assoc :derived-id (:id i))
                                             (assoc :derived-fn (fn [x] (-> x (w/keywordize-keys) :features first :properties)))
                                             (update :name (fn [o] (str o " Features" )))
                                             (assoc :id id)))) [i] (range 1)))
       (conj c i))) [] (flow-common/questions form)))

(defn dataset-columns
  "returns a vector of [{:title :type :id :key :groupName :groupId}]
  `:key` is optional"
  [form]
  (let [questions (flow-questions form)]
    (into (flow-common/commons-columns form)
          (into [{:title "Device Id" :type "text" :id "device_id" :groupName "metadata" :groupId "metadata"}]
                (common/coerce flow-common/question-type->lumen-type questions)))))

(defn render-response
  [type response]
  (condp = type
    "GEO" (let [{:strs [long lat]} response]
            (when (and long lat)
              (postgres/->Geopoint
               (format "POINT (%s %s)" long lat))))
    "GEOSHAPE" (let [feature (-> (w/keywordize-keys response) :features first)
                     geom-type (-> feature :geometry :type)
                     points (-> feature :geometry :coordinates)]
                 (log/debug :geom-type geom-type :points points )
                 (if points
                   (condp = geom-type
                     "LineString" (when (> (count points) 1)
                                    (postgres/->Geoline
                                     (format "LINESTRING (%s)" (->> points
                                                                    (map (partial string/join " " ))
                                                                    (string/join ", " )))))
                     "Polygon"    (let [points (->> (first points)
                                                    (map (partial string/join " " )))]
                                    (when (> (count points) 3)
                                      (postgres/->Geoshape
                                       (format "POLYGON ((%s))" (->> points                                                                                                           (string/join ", " ))))))
                     "MultiPoint" (postgres/->Multipoint
                                   (format "MULTIPOINT (%s)" (->> points
                                                                  (map (partial string/join " " ))
                                                                  (string/join ", " ))))
                     
                     (log/warn :unmapped-geoshape! geom-type))))
    (v2/render-response type response)))

(defn response-data
  [form responses]
  (let [questions (flow-questions form)
        responses (flow-common/question-responses questions responses)]
    (reduce (fn [response-data {:keys [type id repeatable derived-id derived-fn]}]
              (if-let [response ((or derived-fn identity) (get responses (or derived-id id)))]
                (assoc response-data
                       (format "c%s" id)
                       (render-response type response))
                response-data))
            {}
            questions)))

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
               (merge (response-data form (get form-instance "responses"))
                      (flow-common/common-records form-instance data-point)
                      {:device_id (get form-instance "deviceIdentifier")})
               (throw (ex-info "Flow form (dataPointId) referenced data point not in survey"
                               {:form-instance-id (get form-instance "id")
                                :data-point-id data-point-id
                                :instance instance
                                :survey-id (:id survey)})))))
         (flow-common/form-instances headers-fn form))))
