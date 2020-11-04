(ns akvo.lumen.visualisation.maps-test
  (:require
   [akvo.lumen.db.dataset-version :as db.dataset-version]
   [akvo.lumen.db.transformation :refer [dataset-version-by-dataset-id]]
   [akvo.lumen.lib.visualisation.map-config :as map-config]
   [akvo.lumen.lib.visualisation.maps :refer [metadata-layers]]
   [akvo.lumen.fixtures :refer [*tenant-conn*
                                tenant-conn-fixture
                                data-groups-future-fixture
                                system-fixture
                                *system*
                                *error-tracker*
                                error-tracker-fixture]]
   [akvo.lumen.specs.import :as i-c]
   [akvo.lumen.test-utils :refer [import-file update-file] :as tu]
   [clojure.java.jdbc :as jdbc]
   [clojure.test :refer :all]))


(use-fixtures :once
  system-fixture data-groups-future-fixture tenant-conn-fixture
  error-tracker-fixture tu/spec-instrument)


(comment
  ;; generated dataset example
  ;; from spec
  (def dataset-data {:columns-v4 [{:title "Device Id",
                                   :type "text",
                                   :id :device_id,
                                   :groupName "metadata",
                                   :groupId "metadata"}
                                  {:title "Surveyal time",
                                   :type "number",
                                   :id :surveyal_time,
                                   :groupName "metadata",
                                   :groupId "metadata",
                                   :repeatable false}
                                  {:title "Submitted at",
                                   :type "date",
                                   :id :submitted_at,
                                   :groupName "metadata",
                                   :groupId "metadata",
                                   :repeatable false}
                                  {:title "Submitter",
                                   :type "text",
                                   :id :submitter,
                                   :groupName "metadata",
                                   :groupId "metadata",
                                   :repeatable false}
                                  {:title "Display name",
                                   :type "text",
                                   :id :display_name,
                                   :groupName "metadata",
                                   :groupId "metadata",
                                   :repeatable false}
                                  {:title "Instance id",
                                   :type "text",
                                   :id :instance_id,
                                   :key true,
                                   :groupName "metadata",
                                   :groupId "metadata",
                                   :repeatable false}
                                  {:title "Identifier",
                                   :type "text",
                                   :id :identifier,
                                   :groupName "metadata",
                                   :groupId "metadata",
                                   :repeatable false}
                                  {:title "Instance id",
                                   :type "text",
                                   :id "instance_id",
                                   :key false,
                                   :hidden true,
                                   :groupId "group2",
                                   :groupName "not repeatable group",
                                   :repeatable false}
                                  {:title "Instance id",
                                   :type "text",
                                   :id "instance_id",
                                   :key false,
                                   :hidden true,
                                   :groupId "group1",
                                   :groupName "repeatable group",
                                   :repeatable true}
                                  {:title "Column 2",
                                   :key false,
                                   :type "text",
                                   :groupId "group1",
                                   :groupName "repeatable group",
                                   :repeatable true,
                                   :id "c1"}
                                  {:metadata {},
                                   :id "c2",
                                   :title "Column 1",
                                   :type "number",
                                   :groupId "group1",
                                   :groupName "repeatable group",
                                   :repeatable true,
                                   :key false}
                                  {:title "Column 1",
                                   :type "geopoint",
                                   :groupId "group1",
                                   :groupName "repeatable group",
                                   :repeatable true,
                                   :key false,
                                   :id "c3"}
                                  {:title "Column 1",
                                   :type "number",
                                   :groupId "group2",
                                   :groupName "not repeatable group",
                                   :repeatable false,
                                   :key false,
                                   :id "c4"}
                                  {:metadata {},
                                   :id "c5",
                                   :title "Column 3",
                                   :type "date",
                                   :groupId "group2",
                                   :groupName "not repeatable group",
                                   :repeatable false,
                                   :key false}],
                     :columns-v3 [{:title "Device Id",
                                   :type "text",
                                   :id :device_id,
                                   :groupName "metadata",
                                   :groupId "metadata"}
                                  {:title "Surveyal time",
                                   :type "number",
                                   :id :surveyal_time,
                                   :groupName "metadata",
                                   :groupId "metadata",
                                   :repeatable false}
                                  {:title "Submitted at",
                                   :type "date",
                                   :id :submitted_at,
                                   :groupName "metadata",
                                   :groupId "metadata",
                                   :repeatable false}
                                  {:title "Submitter",
                                   :type "text",
                                   :id :submitter,
                                   :groupName "metadata",
                                   :groupId "metadata",
                                   :repeatable false}
                                  {:title "Display name",
                                   :type "text",
                                   :id :display_name,
                                   :groupName "metadata",
                                   :groupId "metadata",
                                   :repeatable false}
                                  {:title "Instance id",
                                   :type "text",
                                   :id :instance_id,
                                   :key true,
                                   :groupName "metadata",
                                   :groupId "metadata",
                                   :repeatable false}
                                  {:title "Identifier",
                                   :type "text",
                                   :id :identifier,
                                   :groupName "metadata",
                                   :groupId "metadata",
                                   :repeatable false}
                                  {:title "Column 2",
                                   :key false,
                                   :type "text",
                                   :groupId "group1",
                                   :groupName "repeatable group",
                                   :repeatable true,
                                   :id "c1"}
                                  {:metadata {},
                                   :id "c2",
                                   :title "Column 1",
                                   :type "number",
                                   :groupId "group1",
                                   :groupName "repeatable group",
                                   :repeatable true,
                                   :key false}
                                  {:title "Column 1",
                                   :type "geopoint",
                                   :groupId "group1",
                                   :groupName "repeatable group",
                                   :repeatable true,
                                   :key false,
                                   :id "c3"}
                                  {:title "Column 1",
                                   :type "number",
                                   :groupId "group2",
                                   :groupName "not repeatable group",
                                   :repeatable false,
                                   :key false,
                                   :id "c4"}
                                  {:metadata {},
                                   :id "c5",
                                   :title "Column 3",
                                   :type "date",
                                   :groupId "group2",
                                   :groupName "not repeatable group",
                                   :repeatable false,
                                   :key false}],
                     :records-v3 [[{:identifier "jF",
                                    :instance_id "0",
                                    :display_name "WC5EzD",
                                    :submitter "",
                                    :submitted_at #inst "2001-08-04T00:00:00Z"
                                    :surveyal_time 2.0,
                                    :device_id "C"}
                                   {"c1" "sj16LZx",
                                    "c2" -2.0,
                                    "c3" {:wkt-string "POINT(10 10)"},
                                    "c4" 6.3671875,
                                    "c5" #inst "1988-07-24T00:00:00Z"}]
                                  [{:identifier "9BwW3",
                                    :instance_id "1",
                                    :display_name "oq9Pa",
                                    :submitter "G3Li",
                                    :submitted_at #inst "2005-10-18T00:00:00Z"
                                    :surveyal_time 1.0,
                                    :device_id "oG"}
                                   {"c1" "2l",
                                    "c2" -0.5,
                                    "c3" {:wkt-string "POINT(10 10)"},
                                    "c4" 1.5,
                                    "c5" #inst "2010-07-15T00:00:00Z"
                                    }]],
                     :records-v4 [{"metadata"
                                   [{:identifier "jF",
                                     :instance_id "0",
                                     :display_name "WC5EzD",
                                     :submitter "",
                                     :submitted_at #inst,"2001-08-04T00:00:00Z"
                                     :surveyal_time 2.0,
                                     :device_id "C"}],
                                   "group1"
                                   [{"c1" "sj16LZx",
                                     "c2" -2.0,
                                     "c3" {:wkt-string "POINT(10 10)"},
                                     :instance_id "0"}
                                    {"c1" "2QaLhJl8",
                                     "c2" 1.0,
                                     "c3" {:wkt-string "POINT(10 10)"},
                                     :instance_id "0"}],
                                   "group2"
                                   [{"c4" 6.3671875,
                                     "c5" #inst "1988-07-24T00:00:00Z"
                                     :instance_id "0"}]}
                                  {"metadata"
                                   [{:identifier "9BwW3",
                                     :instance_id "1",
                                     :display_name "oq9Pa",
                                     :submitter "G3Li",
                                     :submitted_at #inst,"2005-10-18T00:00:00Z"
                                     :surveyal_time 1.0,
                                     :device_id "oG"}],
                                   "group1"
                                   [{"c1" "2l",
                                     "c2" -0.5,
                                     "c3" {:wkt-string "POINT(10 10)"},
                                     :instance_id "1"}
                                    {"c1" "",
                                     "c2" -2.5,
                                     "c3" {:wkt-string "POINT(10 10)"},
                                     :instance_id "1"}],
                                   "group2"
                                   [{"c4" 1.5,
                                     "c5" #inst "2010-07-15T00:00:00Z"
                                     :instance_id "1"}]}]})

  ;; Map configuration example
  ;; From client captured at endpoint
  (def map-layers [{:aggregationMethod "avg",
                    :popup [{:column "c1"} {:column "c2"}],
                    :filters [],
                    :layerType "geo-location",
                    :legend {:title "Name", :visible true, :order {}},
                    :rasterId nil,
                    :pointSize 3,
                    :pointColorMappiqng [],
                    :longitude nil,
                    :datasetId "5fa01fc7-b75b-4a7c-bb91-1e4cf78dc7d7",
                    :title "Summer houses",
                    :geom "d1",
                    :pointColorColumn "c2",
                    :latitude nil,
                    :visible true}])

  ;; Map opts example
  ;; From client captured at endpoint
  (def map-opts {:centre-of-the-world "greenwich"})


  ;; Scratch
  ((juxt :columns-v4 :records-v4) dataset-data)

  (println "---")

  (->> (dataset-data :columns-v4)
       (filter (fn [{:keys [groupId]}] (= groupId "group1")))
       (filter (fn [{:keys [id]}] (= id "c2")))
       )


  (-> (filter (fn [{:strs [metadata]}]
                (= "0" (-> metadata first :instance_id) ))
              (:records-v4 dataset-data))
      (clojure.pprint/pprint))

  ((fn [{:keys [id]}] {:column id}))
  {:column (->> (dataset-data :columns-v4)
                (filter (fn [{:keys [groupId]}] (= groupId "group1")))
                (filter (fn [{:keys [id]}] (= id "instance_id")))
                first
                :id)}


  )

(defn map-layers-from-dataset-data
  [dataset-id {:keys [columns-v4 records-v4] :as dataset-data}]
  (let [;; popup []
        popup [{:column (->> (dataset-data :columns-v4)
                             (filter (fn [{:keys [groupId]}] (= groupId "group1")))
                             (filter (fn [{:keys [id]}] (= id "instance_id")))
                             first
                             :id)}]
        _ (clojure.pprint/pprint popup)
        geom (->> columns-v4
                  (filter (fn [{:keys [groupId]}] (= groupId "group1")))
                  (filter (fn [{:keys [type]}] (= type "geopoint")))
                  first
                  :id)
        pointColorColumn (->> columns-v4
                              (filter (fn [{:keys [groupId]}] (= groupId "group1")))
                              (filter (fn [{:keys [type]}] (= type "number")))
                              first
                              :id)
        layer-0 {:aggregationMethod "avg",
                 ;; :popup [{:column "c1"} {:column "c2"}],
                 :popup popup
                 :filters [],
                 :layerType "geo-location",
                 :legend {:title "Name", :visible true, :order {}},
                 :rasterId nil,
                 :pointSize 3,
                 :pointColorMappiqng [],
                 :longitude nil,
                 ;; :datasetId "5fa01fc7-b75b-4a7c-bb91-1e4cf78dc7d7",
                 :datasetId dataset-id,
                 :title "Summer houses",
                 ;; :geom "d1",
                 :geom geom
                 ;; :pointColorColumn "c2",
                 :pointColorColumn pointColorColumn
                 :latitude nil,
                 :visible true}]
    [layer-0]))

(deftest ^:functional basic-map

  (let [groups [{:groupId "group1"
                 :groupName "repeatable group"
                 :repeatable true
                 :column-types ["text" "number" "geopoint"]
                 :max-responses 10}
                {:groupId "group2"
                 :groupName "not repeatable group"
                 :repeatable false
                 :column-types ["number" "date"]}]
        dataset-data (i-c/flow-sample-imported-dataset groups 2)
        dataset-id (import-file *tenant-conn* *error-tracker*
                                {:dataset-name "Generated map"
                                 :kind "clj-flow"
                                 :data dataset-data})
        dataset (dataset-version-by-dataset-id *tenant-conn*
                                               {:dataset-id dataset-id
                                                :version 1})
        dataset-version-2 (db.dataset-version/latest-dataset-version-2-by-dataset-id *tenant-conn* {:dataset-id dataset-id})]

    (testing "Flow map from dataset_verison"
      (let [layers (map-layers-from-dataset-data dataset-id dataset-data)
            opts {:centre-of-the-world "greenwich"}
            metadata-array (metadata-layers *tenant-conn* layers opts)
            map-config (map-config/build *tenant-conn* layers metadata-array)
            {:keys [geom_column sql]} (-> map-config :layers first :options)
            sql-result (jdbc/query *tenant-conn* sql)]


        (clojure.pprint/pprint r)
        (is false)))
    #_(testing "Flow map from dataset_verison_2"
        (clojure.pprint/pprint dataset-version-2)
        (is false))
    )
  )
