(ns akvo.lumen.lib.import.flow-v2
  (:require [akvo.commons.psql-util :as pg]
            [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.util :as util]
            [akvo.lumen.lib.import.flow-common :as flow-common]
            [cheshire.core :as json]
            [clj-http.client :as http]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str])
  (:import [java.time Instant]))


(defn question-type->lumen-type
  [question]
  (condp = (:type question)
    "NUMBER" "number"
    "DATE" "date"
    "text"))

(defn dataset-columns
  [form]
  (into (flow-common/commons-columns form)
        (into
         [{:title "Latitude" :type "number" :id :latitude}
          {:title "Longitude" :type "number" :id :longitude}]
         (common/coerce question-type->lumen-type (flow-common/questions form)))))

(defmulti render-response
  (fn [type response]
    type))

(defmethod render-response "DATE"
  [_ response]
  (Instant/parse response))

(defmethod render-response "FREE_TEXT"
  [_ response]
  response)

(defmethod render-response "NUMBER"
  [_ response]
  response)

(defmethod render-response "SCAN"
  [_ response]
  response)

(defmethod render-response "OPTION"
  [_ response]
  (str/join "|" (map (fn [{:strs [text code]}]
                       (if code
                         (str/join ":" [code text])
                         text))
                     response)))

(defmethod render-response "GEO"
  [_ response]
  (condp = (get-in response ["geometry" "type"])
    "Point" (let [coords (get-in response ["geometry" "coordinates"])]
              (str/join "," coords))
    nil))

(defmethod render-response "CASCADE"
  [_ response]
  (str/join "|" (map (fn [item]
                       (get item "name"))
                     response)))

(defmethod render-response "PHOTO"
  [_ response]
  (get response "filename"))

(defmethod render-response "VIDEO"
  [_ response]
  (get response "filename"))

(defmethod render-response "CADDISFLY"
  [_ response]
  (json/generate-string response))

(defmethod render-response :default
  [type response]
  nil)

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
  "Returns a lazy sequence of form data, ready to be inserted as a lumen dataset"
  [headers-fn survey form-id]
  (let [form (flow-common/form survey form-id)
        data-points (util/index-by "id" (flow-common/data-points headers-fn survey))]
    (map (fn [form-instance]
           (let [data-point-id (get form-instance "dataPointId")
                 data-point (get data-points data-point-id)]
             (merge (response-data form (get form-instance "responses"))
                    (flow-common/common-records form-instance data-point)
                    {:latitude (get-in data-points [data-point-id "latitude"])
                     :longitude (get-in data-points [data-point-id "longitude"])})))
         (flow-common/form-instances headers-fn form))))
