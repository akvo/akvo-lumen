(ns akvo.lumen.lib.import.clj-data-importer-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         data-groups-future-fixture
                                         system-fixture
                                         *system*
                                         *error-tracker*
                                         error-tracker-fixture]]
            [clojure.tools.logging :as log]
            [akvo.lumen.specs.import :as i-c]
            [akvo.lumen.lib.import.clj-data-importer :as i]
            [akvo.lumen.db.transformation :refer [latest-dataset-version-by-dataset-id dataset-version-by-dataset-id]]
            [akvo.lumen.db.data-group :as db.data-group]
            [akvo.lumen.db.dataset-version :as db.dataset-version]
            [akvo.lumen.db.transformation-test :refer [get-data]]
            [akvo.lumen.test-utils :refer [import-file update-file] :as tu]
            [akvo.lumen.utils.logging-config :refer [with-no-logs]]
            [clojure.string :as string]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql])
  (:import [java.util.concurrent ExecutionException]))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")

(use-fixtures :once system-fixture data-groups-future-fixture tenant-conn-fixture error-tracker-fixture tu/spec-instrument)

(deftest ^:functional test-import
  (testing "Testing import csv"
    (let [dataset-id (import-file *tenant-conn* *error-tracker*
                                  {:dataset-name "Padded titles"
                                   :kind "clj"
                                   :data (i-c/csv-sample-imported-dataset [:text :number] 2) })
          dataset (dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id
                                                                :version 1})
          dataset-version-2 (db.dataset-version/latest-dataset-version-2-by-dataset-id *tenant-conn* {:dataset-id dataset-id})
          data-groups (db.data-group/list-data-groups-by-dataset-version-id *tenant-conn* {:dataset-version-id (:id dataset-version-2)})
          data-groups-stored-data (->> (first data-groups)
                                       (get-data *tenant-conn*))
          stored-data (->> (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                 {:dataset-id dataset-id})
                           (get-data *tenant-conn*))

          expected-stored-data '((:rnum :c1 :c2) (:rnum :c1 :c2))]
      (is (= 1 (count data-groups)))
      (let [data-group (first data-groups)]
        (is (= (:group_id data-group) "main"))
        (is (= (:group_name data-group) "main"))
        (is (= (:repeatable data-group) false))

        )


      (is (= (map keys stored-data) expected-stored-data))
      (is (= (map keys data-groups-stored-data) expected-stored-data))))
  (testing "Testing import flow"
    (let [groups [{:groupId "group1"
                   :groupName "repeatable group"
                   :repeatable true
                   :columns ["option" "text"]
                   :max-responses 10}
                  {:groupId "group2"
                   :groupName "not repeatable group"
                   :repeatable false
                   :columns ["number" "date"]}]
          dataset-id (import-file *tenant-conn* *error-tracker*
                                  {:dataset-name "Padded titles"
                                   :kind "clj-flow"
                                   :data (i-c/flow-sample-imported-dataset groups 2)})
          dataset (dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id
                                                                :version 1})
          dataset-version-2 (db.dataset-version/latest-dataset-version-2-by-dataset-id *tenant-conn* {:dataset-id dataset-id})
          data-groups (db.data-group/list-data-groups-by-dataset-version-id *tenant-conn* {:dataset-version-id (:id dataset-version-2)})
          stored-data (->> (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                 {:dataset-id dataset-id})
                           (get-data *tenant-conn*))

          expected-stored-data '(:rnum            
                                 :device_id
                                 :surveyal_time
                                 :submitted_at
                                 :submitter
                                 :display_name
                                 :instance_id
                                 :identifier)]
      (is (= 3 (count data-groups)))
      (let [data-group (first data-groups)]
        (is (= (:group_id data-group) "metadata"))
        (is (= (:group_name data-group) "metadata"))
        (is (= (:repeatable data-group) false)))
      (is (= (keys (first stored-data)) expected-stored-data))
      (is (= (keys (first (->> (first data-groups)
                               (get-data *tenant-conn*)))) expected-stored-data)))))

(deftest ^:functional test-update
  (testing "Testing update"
    (let [[job dataset] (import-file *tenant-conn* *error-tracker*
                                     {:dataset-name "Padded titles"
                                      :kind "clj"
                                      :data (i-c/csv-sample-imported-dataset [:text :number] 2)
                                      :with-job? true})
          dataset-id (:dataset_id dataset)
          dataset (dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id
                                                                :version 1})
          stored-data (->> (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                 {:dataset-id dataset-id})
                           (get-data *tenant-conn*))
          updated-res (update-file *tenant-conn* (:akvo.lumen.component.caddisfly/caddisfly *system*)
                                   *error-tracker* (:dataset-id job) (:data-source-id job)
                                   {:kind "clj"
                                    :data (i-c/csv-sample-imported-dataset [:text :number] 2)})]
      (is (some? updated-res)))))
