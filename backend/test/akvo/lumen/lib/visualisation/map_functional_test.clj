(ns akvo.lumen.lib.visualisation.map-functional-test
  (:require
   [akvo.lumen.db.transformation :refer [dataset-version-by-dataset-id]]
   [akvo.lumen.lib.dataset :as dataset]
   [akvo.lumen.fixtures :refer [*error-tracker*
                                *tenant-conn*
                                data-groups-future-fixture
                                error-tracker-fixture
                                system-fixture
                                tenant-conn-fixture]]
   [akvo.lumen.lib.visualisation.map-config :as v.map-config]
   [akvo.lumen.lib.visualisation.maps :as v.maps]
   [akvo.lumen.specs.import :as i-c]
   [akvo.lumen.test-utils :as tu]
   [clj-time.format :as f]
   [clojure.java.jdbc :as jdbc]
   [clojure.walk :as walk]
   [clojure.test :refer [deftest testing is use-fixtures]])
  (:import [java.sql Date]
           [java.time Instant]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Fixtures
;;;

(def groups-spec [{:groupId "group1"
                   :groupName "repeatable group"
                   :repeatable true
                   :column-types ["text" "number" "geopoint"]
                   :max-responses 10}
                  {:groupId "group2"
                   :groupName "not repeatable group"
                   :repeatable false
                   :column-types ["number" "date"]}])

(def ^:dynamic *dataset-data*)
(defn dataset-data-fixture [f]
  (binding [*dataset-data* (i-c/flow-sample-imported-dataset groups-spec 2)]
    (f)))

(def ^:dynamic *dataset-id*)
(defn dataset-id-fixture [f]
  (binding [*dataset-id* (tu/import-file *tenant-conn* *error-tracker*
                                         {:dataset-name "Generated map"
                                          :kind "clj-flow"
                                          :data *dataset-data*})]
    (f)
    (dataset/delete *tenant-conn* *dataset-id*)))


(use-fixtures :once
  system-fixture data-groups-future-fixture tenant-conn-fixture
  error-tracker-fixture tu/spec-instrument dataset-data-fixture
  dataset-id-fixture)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Utility fns, random data but we're using same form on the data and are
;;; utilizing the form to get things like pointColourColumn and popupColumn
;;;

(defn popup
  "Get one col from each group"
  [columns-v4]
  [{:column (->> columns-v4
                 (filter (fn [{:keys [groupId key]}]
                           (and (= groupId "metadata") (= key true))))
                 first :id name)}
   {:column (->> columns-v4
                 (filter (fn [{:keys [groupId type]}]
                           (and (= groupId "group1") (= type "number"))))
                 first :id)}
   {:column (->> columns-v4
                 (filter (fn [{:keys [groupId type]}]
                           (and (= groupId "group2") (= type "date"))))
                 first :id)}])

(defn geom
  "Get the geopoint col"
  [columns-v4]
  (->> columns-v4 (filter #(= (:type %) "geopoint")) first :id))


(defn pointColorColumn
  "Get the column used as point colour column"
  [columns-v4]
  (->> columns-v4 (filter #(and (= (:groupId %) "group2")
                                (= (:type %) "number")))
       first :id))

(defn layers
  [dataset-id {:keys [columns-v4]}]
  [{:aggregationMethod "avg"
    :popup (popup columns-v4)
    :filters []
    :layerType "geo-location"
    :legend {:title "Name", :visible true, :order {}}
    :rasterId nil
    :pointSize 3
    :pointColorMapping []
    :longitude nil
    :datasetId dataset-id
    :title "Random map"
    :geom (geom columns-v4)
    :pointColorColumn (pointColorColumn columns-v4)
    :latitude nil
    :visible true}])

(defmulti verify-val (fn [_ f]
                    (cond
                      (inst? f) :inst
                      (map? f) :geopoint ;; a bit simplistic :-)
                      :else :default)))

(defmethod verify-val :inst [v f]
  ;; Since we convert datetime with timezone to text in the mapconfig sql
  (let [custom-formatter (f/formatter "yyyy-MM-dd HH:mm:ssZ")]
    (is (= (inst-ms (.toInstant (f/parse custom-formatter v)))
           (inst-ms f)))))


(defmethod verify-val :geopoint [v {:strs [wkt-string]}]
  (let [gs (format "SRID=4326;%s" wkt-string)]
    (when-not (= v gs)
      (clojure.pprint/pprint gs))
    (is (= v gs))))

(comment
  ;; For some reason sometimes the points coordinate have higher resolution than
  ;; the generated data we put in. So far only seen a padded zero added.

  ;; SELECT ST_Distance(
  ;;   ST_AsText(GeomFromEWKT('SRID=4326;POINT(111.1111111 1.1111111)'), 2),
  ;;   ST_AsText(GeomFromEWKT('SRID=4326;POINT(111.1111111 1.111)'), 2)
  ;; )

)

(defmethod verify-val :default [v f]
  (is (= v f)))

(defn verify-cell
  [[instance_id coll v] facts]
  (let [coll (name coll)
        r (first (filter (fn [fact-record]
                           (and (= (get fact-record "instance_id") instance_id)
                                (contains? fact-record coll)))
                         facts))]
    (verify-val v (get r coll))))

(defn check-data
  [{:keys [records-v4]} queried-data]
  (let [facts (mapcat #(-> % vals flatten walk/stringify-keys) records-v4)]
    (doall (map (fn [{:keys [instance_id] :as record}]
                  (doall (map (fn [cell]
                                (verify-cell (cons instance_id cell) facts))
                              record)))
                queried-data))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(deftest ^:functional basic-map

  (testing "Map from Flow dataset using dataset_version"
    (let [layers (layers *dataset-id* *dataset-data*)
          opts {:centre-of-the-world "greenwich"}
          metadata-array (v.maps/metadata-layers *tenant-conn* layers opts)
          map-config (v.map-config/build *tenant-conn* layers metadata-array)
          {:keys [sql]} (-> map-config :layers first :options)
          sql-result (jdbc/query *tenant-conn* sql)]
      (check-data *dataset-data* sql-result))))
