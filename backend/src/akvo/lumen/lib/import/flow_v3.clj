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
                                             (assoc :ns (:ns i))
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
          (into [{:title "Device Id" :type "text" :id "device_id" :groupName "metadata" :groupId "metadata" :ns "main"}]
                (common/coerce flow-common/question-type->lumen-type questions)))))

(defn extract-geo [response]
  (let [{:strs [long lat]} response]
    (when (and long lat)
      (postgres/->Geopoint
       (format "POINT (%s %s)" long lat)))))

(defn extract-geoshape [response]
  (let [feature (-> (w/keywordize-keys response) :features first)
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
        
        (log/warn :unmapped-geoshape! geom-type)))))

(defn render-response
  [repeatable type response]
  (condp = type
    "GEO" (if repeatable (map extract-geo response) (extract-geo response))
    "GEOSHAPE" (if repeatable (map extract-geoshape response) (extract-geoshape response))
    (v2/render-response repeatable type response)))

(defn response-data
  [form responses]
  (let [questions (flow-questions form)
        responses (flow-common/question-responses questions responses)]
    (reduce (fn [response-data {:keys [type id ns derived-id derived-fn]}]
              (if-let [response ((or derived-fn identity) (get responses (or derived-id id)))]
                (assoc response-data
                       (format "c%s" id)
                       (render-response (and ns (not= ns "main")) type response))
                response-data))
            {}
            questions)))

(def questions* [{:groupId "597899156",
  :ns "597899156",
  :name "Name",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:47:32.786Z",
  :type "FREE_TEXT",
  :personalData false,
  :variableName nil,
  :id "583119147",
  :order 1,
  :modifiedAt "2020-06-09T13:47:53.534Z"}
 {:groupId "597899156",
  :ns "597899156",
  :name "Age",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:47:34.083Z",
  :type "NUMBER",
  :personalData false,
  :variableName nil,
  :id "594979148",
  :order 2,
  :modifiedAt "2020-06-09T13:48:07.215Z"}
 {:groupId "597899156",
  :ns "597899156",
  :name "Likes Pizza",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:47:35.352Z",
  :type "OPTION",
  :personalData false,
  :variableName nil,
  :id "609479145",
  :order 3,
  :modifiedAt "2020-06-09T13:48:57.306Z"}
 {:groupId "597899156",
  :ns "597899156",
  :name "Likes pasta",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:48:59.057Z",
  :type "OPTION",
  :personalData false,
  :variableName nil,
  :id "617319146",
  :order 4,
  :modifiedAt "2020-06-09T13:49:41.655Z"}
 {:groupId "597899156",
  :ns "597899156",
  :name "Region",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:49:43.600Z",
  :type "CASCADE",
  :personalData false,
  :variableName nil,
  :id "601879162",
  :order 5,
  :modifiedAt "2020-06-09T13:51:06.210Z"}
 {:groupId "597899156",
  :ns "597899156",
  :name "Current location",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:51:09.442Z",
  :type "GEO",
  :personalData false,
  :variableName nil,
  :id "601889144",
  :order 6,
  :modifiedAt "2020-06-09T13:51:44.098Z"}
 {:groupId "597899156",
  :ns "597899156",
  :name "Photo",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:51:46.611Z",
  :type "PHOTO",
  :personalData false,
  :variableName nil,
  :id "601899165",
  :order 7,
  :modifiedAt "2020-06-09T13:52:01.245Z"}
 {:groupId "597899156",
  :ns "597899156",
  :name "Video",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:52:02.454Z",
  :type "VIDEO",
  :personalData true,
  :variableName nil,
  :id "601879163",
  :order 8,
  :modifiedAt "2020-06-09T13:52:17.637Z"}
 {:groupId "597899156",
  :ns "597899156",
  :name "DOB",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:52:18.955Z",
  :type "DATE",
  :personalData true,
  :variableName nil,
  :id "601899166",
  :order 9,
  :modifiedAt "2020-06-09T13:52:39.563Z"}
 {:groupId "597899156",
  :ns "597899156",
  :name "Barcode",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:52:53.882Z",
  :type "SCAN",
  :personalData false,
  :variableName nil,
  :id "599649166",
  :order 10,
  :modifiedAt "2020-06-09T13:53:16.516Z"}
 {:groupId "597899156",
  :ns "597899156",
  :name "Shape",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:53:18.703Z",
  :type "GEOSHAPE",
  :personalData false,
  :variableName nil,
  :id "615289146",
  :order 11,
  :modifiedAt "2020-06-09T13:53:35.219Z"}
 {:groupId "597899156",
  :ns "597899156",
  :name "Shape Features",
  :derived-fn identity,
  :groupName "Repeated",
  :createdAt "2020-06-09T13:53:18.703Z",
  :type "GEO-SHAPE-FEATURES",
  :personalData false,
  :variableName nil,
  :multipleId "615289146",
  :id "615289146_0",
  :order 11,
  :multipleType "geo-shape-features",
  :modifiedAt "2020-06-09T13:53:35.219Z",
  :derived-id "615289146"}
 {:groupId "597899156",
  :ns "597899156",
  :name "Signature",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:53:36.746Z",
  :type "SIGNATURE",
  :personalData false,
  :variableName nil,
  :id "597909145",
  :order 12,
  :modifiedAt "2020-06-09T13:53:50.225Z"}
 {:groupId "597899156",
  :ns "597899156",
  :name "Caddisfly",
  :groupName "Repeated",
  :createdAt "2020-06-09T13:53:52.115Z",
  :type "CADDISFLY",
  :personalData false,
  :variableName nil,
  :id "615289147",
  :order 13,
  :modifiedAt "2020-06-09T13:54:24.307Z",
  :caddisflyResourceUuid "520ba67c-233f-4dc7-a2ad-17d86047d7c4"}
 {:groupId "617319144",
  :ns "main",
  :name "Family name",
  :groupName "Non repeatable",
  :createdAt "2020-06-09T13:46:35.817Z",
  :type "FREE_TEXT",
  :personalData false,
  :variableName nil,
  :id "617309149",
  :order 1,
  :modifiedAt "2020-06-09T13:47:25.423Z"}
 {:groupId "617319144",
  :ns "main",
  :name "Location",
  :groupName "Non repeatable",
  :createdAt "2020-06-09T13:47:05.152Z",
  :type "GEO",
  :personalData false,
  :variableName nil,
  :id "588869155",
  :order 2,
  :modifiedAt "2020-06-09T13:47:20.516Z"}])


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
