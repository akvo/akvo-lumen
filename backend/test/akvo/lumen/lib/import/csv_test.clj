(ns akvo.lumen.lib.import.csv-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         system-fixture
                                         *error-tracker*
                                         error-tracker-fixture]]
            [akvo.lumen.test-utils :refer [import-file]]
            [akvo.lumen.utils.logging-config :refer [with-no-logs]]
            [clojure.string :as string]
            [akvo.lumen.test-utils :as tu]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql])
  (:import [java.util.concurrent ExecutionException]))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")


(use-fixtures :once system-fixture tenant-conn-fixture error-tracker-fixture tu/spec-instrument)


(deftest ^:functional test-dos-file
  (testing "Import of DOS-formatted CSV file"
    (let [dataset-id (import-file *tenant-conn* *error-tracker* {:file "dos.csv" :dataset-name "DOS data"})
          dataset (dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id
                                                                :version 1})]
      (is (= 2 (count (:columns dataset)))))))

(deftest ^:functional test-mixed-columns
  (testing "Import of mixed-type data"
    (let [dataset-id (import-file *tenant-conn* *error-tracker* {:file "mixed-columns.csv"
                                                                 :dataset-name "Mixed Columns"})
          dataset (dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id
                                                                :version 1})
          columns (:columns dataset)]
      (is (= "text" (get (first columns) "type")))
      (is (= "number" (get (second columns) "type")))
      (is (= "text" (get (last columns) "type"))))))

(deftest ^:functional test-geoshape-csv
  (testing "Import csv file generated from a shapefile"
    (let [dataset-id (import-file *tenant-conn* *error-tracker* {:dataset-name "Liberia shapefile"
                                                                 :file "liberia_adm2.csv"
                                                                 :has-column-headers? true})
          dataset (dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id
                                                                :version 1})
          columns (:columns dataset)]
      (is (= "geoshape" (get (first columns) "type")))
      (is (= "number" (get (second columns) "type")))
      (is (= "text" (get (last columns) "type")))
      (is (= (count columns) 15)))))

(deftest ^:functional test-varying-column-count
  (testing "Should fail to import csv file with varying number of columns"
    (let [job-execution-id (import-file *tenant-conn* *error-tracker* {:dataset-name "Mixed Column Counts"
                                                                       :file "mixed-column-counts.csv"})]
      (is (= "Invalid csv file. Varying number of columns"
             (:error-message (job-execution-by-id *tenant-conn* {:id job-execution-id})))))))

(deftest ^:functional test-trimmed-columns
  (testing "Testing if whitespace is removed from beginning & end of column titles"
    (let [dataset-id (import-file *tenant-conn* *error-tracker* {:dataset-name "Padded titles"
                                                                 :file "whitespace.csv"})
          dataset (dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id
                                                                :version 1})
          titles (map :title (:rows dataset))
          trimmable? #(or (string/starts-with? " " %) (string/ends-with? " " %))]
      (is (every? trimmable? titles)))))

