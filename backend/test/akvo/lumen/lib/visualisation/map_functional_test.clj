(ns akvo.lumen.lib.visualisation.map-functional-test
  (:require
   [akvo.lumen.db.transformation :refer [dataset-version-by-dataset-id]]
   [akvo.lumen.fixtures :refer [*error-tracker*
                                *system*
                                *tenant-conn*
                                data-groups-future-fixture
                                error-tracker-fixture
                                system-fixture
                                tenant-conn-fixture]]
   [akvo.lumen.lib.visualisation.map-config :as v.map-config]
   [akvo.lumen.lib.visualisation.maps :as v.maps]
   [akvo.lumen.specs.import :as i-c]
   [akvo.lumen.test-utils :refer [import-file update-file] :as tu]
   [clj-time.core :as t]
   [clojure.java.jdbc :as jdbc]
   [clojure.walk :as walk]
   [clojure.test :refer [deftest testing is use-fixtures]]))

;; clean up dataset once we are done, fixture?

(def groups-spec [{:groupId "group1"
                   :groupName "repeatable group"
                   :repeatable true
                   :column-types ["text" "number" "geopoint"]
                   :max-responses 10}
                  {:groupId "group2"
                   :groupName "not repeatable group"
                   :repeatable false
                   :column-types ["number" "date"]}])

(comment

  (def tmp-dataset-data (i-c/flow-sample-imported-dataset groups-spec 2))
  (clojure.pprint/pprint (:records-v4 tmp-dataset-data))

  )

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

(comment
  (popup (:columns-v4 tmp-dataset-data))
  )

(defn geom
  "Get the geopoint col"
  [columns-v4]
  (->> columns-v4 (filter #(= (:type %) "geopoint")) first :id))

(comment
  (geom (:columns-v4 tmp-dataset-data))
  )

(defn pointColorColumn [columns-v4]
  (->> columns-v4 (filter #(and (= (:groupId %) "group2")
                                (= (:type %) "number")))
       first :id))

(comment
  (pointColorColumn (:columns-v4 tmp-dataset-data))
  )


(defn layers
  [dataset-id {:keys [columns-v4 records-v4]}]
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


(comment
  (layers "abc-123" tmp-dataset-data)
  )

(defmulti verify-val (fn [v f]
                    (cond
                      (inst? f) :inst
                      (map? f) :geopoint ;; a bit simplistic :-)
                      :else :default)))

(defmethod verify-val :inst [v f]
  (clojure.pprint/pprint {:v v
                          :f f})
  (is (= v (.toString f))))

;; For some reason some times one has more resolution - why???
(defmethod verify-val :geopoint [v {:strs [wkt-string]}]
  (is (= v (format "SRID=4326;%s" wkt-string))))

(defmethod verify-val :default [v f]
  (prn "@default")
  (clojure.pprint/pprint {:v v
                          :f f})
  (is (= v f)))

(defn verify-cell
  [[instance_id coll v :as cell] facts]
  (let [coll (name coll)
        r (first (filter (fn [fact-record]
                           (and (= (get fact-record "instance_id") instance_id)
                                (contains? fact-record coll)))
                         facts))]
    (verify-val v (get r coll))))

(defn check-data
  [{:keys [records-v4] :as generated-data} queried-data]
  (let [facts (mapcat #(-> % vals flatten walk/stringify-keys) records-v4)]
    (clojure.pprint/pprint facts)
    (doall (map (fn [{:keys [instance_id] :as record}]
                  (doall (map (fn [cell]
                                (verify-cell (cons instance_id cell) facts))
                              record)))
                queried-data))))

(use-fixtures :once
  system-fixture data-groups-future-fixture tenant-conn-fixture
  error-tracker-fixture tu/spec-instrument)

(deftest ^:functional basic-map
  (let [dataset-import-data (i-c/flow-sample-imported-dataset groups-spec 2)
        imported-dataset-id (tu/import-file *tenant-conn* *error-tracker*
                                            {:dataset-name "Generated map"
                                             :kind "clj-flow"
                                             :data dataset-import-data})]


    (testing "Map from Flow dataset using dataset_version"
      (let [dataset (dataset-version-by-dataset-id *tenant-conn*
                                                   {:dataset-id imported-dataset-id
                                                    :version 1})
            layers (layers imported-dataset-id dataset-import-data)
            opts {:centre-of-the-world "greenwich"}
            metadata-array (v.maps/metadata-layers *tenant-conn* layers opts)
            map-config (v.map-config/build *tenant-conn* layers metadata-array)
            {:keys [geom_column interactivity sql]} (-> map-config
                                                        :layers first :options)
            sql-result (jdbc/query *tenant-conn* sql)]
        (check-data dataset-import-data sql-result)))))
