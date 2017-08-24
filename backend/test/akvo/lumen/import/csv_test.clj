(ns akvo.lumen.import.csv-test
  (:require [akvo.lumen.fixtures :refer [migrate-tenant rollback-tenant]]
            [akvo.lumen.test-utils
             :refer
             [import-file test-tenant test-tenant-conn]]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/transformation.sql")


(def ^:dynamic *tenant-conn*)

(defn fixture [f]
  (migrate-tenant test-tenant)
  (binding [*tenant-conn* (test-tenant-conn test-tenant)]
    (f)
    (rollback-tenant test-tenant)))

(use-fixtures :once fixture)


(deftest ^:functional test-dos-file
  (testing "Import of DOS-formatted CSV file"
    (try
      (let [dataset-id (import-file *tenant-conn* "dos.csv" {:dataset-name "DOS data"})
            dataset (dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id
                                                                  :version 1})]
        (is (= 2 (count (:columns dataset)))))
      (catch Exception e
        (.printStackTrace (.getCause e))))))

(deftest ^:functional test-mixed-columns
  (testing "Import of mixed-type data"
    (let [dataset-id (import-file *tenant-conn* "mixed-columns.csv" {:dataset-name "Mixed Columns"})
          dataset (dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id
                                                                :version 1})
          columns (:columns dataset)]
      (is (= "text" (get (first columns) "type")))
      (is (= "number" (get (second columns) "type")))
      (is (= "text" (get (last columns) "type"))))))

(deftest ^:functional test-varying-column-count
  (testing "Should fail to import csv file with varying number of columns"
    (is (thrown-with-msg? clojure.lang.ExceptionInfo
                          #"Invalid csv file. Varying number of columns"
                          (import-file *tenant-conn* "mixed-column-counts.csv"
                                         {:dataset-name "Mixed Column Counts"})))))
