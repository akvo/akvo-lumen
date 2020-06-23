(ns akvo.lumen.lib.import.flow-v2
  (:require [akvo.commons.psql-util :as pg]
            [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.util :as util]
            [akvo.lumen.lib.import.flow-common :as flow-common]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str])
  (:import [java.time Instant]))

(defn dataset-columns
  [form]
  (into (flow-common/commons-columns form)
        (into
         (->> [{:title "Latitude" :type "number" :id "latitude"}
               {:title "Longitude" :type "number" :id "longitude"}]
              (mapv #(assoc % :groupName "metadata" :groupId "metadata" :ns "main")))
         (common/coerce flow-common/question-type->lumen-type (flow-common/questions form)))))

(defn- col-adapter [repeatable fun response]
  (if repeatable
    (map fun response)
    (fun response)))

(defmulti render-response
  (fn [repeatable type response]
    type))

(defmethod render-response "DATE"
  [repeatable _ response]
  (col-adapter repeatable #(Instant/parse %) response))

(defmethod render-response "FREE_TEXT"
  [repeatable _ response]
  (col-adapter repeatable identity response))

(defmethod render-response "NUMBER"
  [repeatable _ response]
  (col-adapter repeatable identity response))

(defmethod render-response "SCAN"
  [repeatable _ response]
  (col-adapter repeatable identity response))

(defmethod render-response "OPTION"
  [repeatable _ response]
  (let [fun #(str/join "|" (map (fn [{:strs [text code]}]
                                  (if code
                                    (str/join ":" [code text])
                                    text))
                                %))]
   (col-adapter repeatable fun response)))

(defmethod render-response "GEO"
  [repeatable _ response]
  (let [fun #(condp = (get-in response ["geometry" "type"])
    "Point" (let [coords (get-in % ["geometry" "coordinates"])]
              (str/join "," coords))
    nil)]
    (col-adapter repeatable fun response)))

(defmethod render-response "CASCADE"
  [repeatable _ response]
  (let [fun #(str/join "|" (map (fn [item]
                                  (get item "name"))
                                %))]
    (col-adapter repeatable fun response)))

(defmethod render-response "PHOTO"
  [repeatable _ response]
  (col-adapter repeatable #(get % "filename") response))

(defmethod render-response "VIDEO"
  [repeatable _ response]
  (col-adapter repeatable #(get % "filename") response))

(defmethod render-response "CADDISFLY"
  [repeatable _ response]
  (col-adapter repeatable json/generate-string response))

(defmethod render-response "GEO-SHAPE-FEATURES"
  [repeatable _ response]
  (col-adapter repeatable json/generate-string response))

(defmethod render-response :default
  [repeatable type response]
  (col-adapter repeatable (constantly nil) response))

(defn response-data
  [form responses]
  (let [questions (flow-common/questions form)
        responses (flow-common/question-responses questions responses)]
    (reduce (fn [response-data {:keys [type id ns]}]
              (if-let [response (get responses id)]
                (assoc response-data
                       (format "c%s" id)
                       (render-response (and ns (not= ns "main")) type response))
                response-data))
            {}
            questions)))

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
