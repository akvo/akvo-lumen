(ns akvo.lumen.lib.visualisation.map-functional-test
  (:require
   [akvo.lumen.db.transformation :refer [dataset-version-by-dataset-id]]
   [akvo.lumen.fixtures :refer [*tenant-conn*
                                tenant-conn-fixture
                                data-groups-future-fixture
                                system-fixture
                                *system*
                                *error-tracker*
                                error-tracker-fixture]]
   [akvo.lumen.specs.import :as i-c]
   [akvo.lumen.test-utils :refer [import-file update-file] :as tu]
   [clojure.test :refer [deftest testing is use-fixtures]]))


(def groups-spec [{:groupId "group1"
                   :groupName "repeatable group"
                   :repeatable true
                   :column-types ["text" "number" "geopoint"]
                   :max-responses 10}
                  {:groupId "group2"
                   :groupName "not repeatable group"
                   :repeatable false
                   :column-types ["number" "date"]}])

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
                                                    :version 1})]
        (clojure.pprint/pprint dataset)
        (is false))
      ))
  )


(comment


  )
