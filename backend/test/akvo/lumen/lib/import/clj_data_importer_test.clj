(ns akvo.lumen.lib.import.clj-data-importer-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         *error-tracker*
                                         error-tracker-fixture]]
            [clojure.tools.logging :as log]
            [akvo.lumen.specs.import :as i-c]
            [akvo.lumen.lib.import.clj-data-importer :as i]
            [akvo.lumen.test-utils :refer [import-file update-file]]
            [akvo.lumen.utils.logging-config :refer [with-no-logs]]
            [clojure.string :as string]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql])
  (:import [java.util.concurrent ExecutionException]))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation_test.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")

(use-fixtures :once tenant-conn-fixture error-tracker-fixture)

(deftest ^:functional test-import
  (testing "Testing import"
    (let [dataset-id (import-file *tenant-conn* *error-tracker* 
                                  {:dataset-name "Padded titles"
                                   :kind "clj"
                                   :data (i-c/sample-imported-dataset [:text :number] 2) })
          dataset (dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id
                                                                :version 1})
          stored-data (->> (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                 {:dataset-id dataset-id})
                           (get-data *tenant-conn*))]
      (is (= (map keys (:columns dataset)) '(("key"
	                                      "sort"
	                                      "direction"
	                                      "title"
	                                      "type"
	                                      "multipleType"
	                                      "hidden"
	                                      "multipleId"
	                                      "columnName")
                                             ("key"
	                                      "sort"
	                                      "direction"
	                                      "title"
	                                      "type"
	                                      "multipleType"
	                                      "hidden"
	                                      "multipleId"
	                                      "columnName"))))

      (is (= (map #(select-keys % ["type" "columnName"]) (:columns dataset))
             '({"type" "text", "columnName" "c1"}
	       {"type" "number", "columnName" "c2"})))

      (is (= (map keys stored-data) '((:rnum :c1 :c2) (:rnum :c1 :c2)))))))

(deftest ^:functional test-update
  (testing "Testing update"
    (let [[job dataset] (import-file *tenant-conn* *error-tracker* 
                                     {:dataset-name "Padded titles"
                                      :kind "clj"
                                      :data (i-c/sample-imported-dataset [:text :number] 2) 
                                      :with-job? true})
          dataset-id (:dataset_id dataset)
          dataset (dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id
                                                                :version 1})
          stored-data (->> (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                 {:dataset-id dataset-id})
                           (get-data *tenant-conn*))
          updated-res (update-file *tenant-conn* *error-tracker* (:dataset_id job) (:data_source_id job)
                        {:kind "clj"
                         :data (i-c/sample-imported-dataset [:text :number] 2)})]
      (is (some? updated-res)))))
