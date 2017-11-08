(ns akvo.lumen.import.csv-test
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture]]
            [akvo.lumen.test-utils :refer [import-file]]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/transformation.sql")


(use-fixtures :once tenant-conn-fixture)


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

(deftest ^:functional test-geoshape-csv
  (testing "Import csv file generated from a shapefile"
    (let [dataset-id (import-file *tenant-conn* "liberia_adm2.csv" {:dataset-name "Liberia shapefile"
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
    (is (thrown-with-msg? clojure.lang.ExceptionInfo
                          #"Invalid csv file. Varying number of columns"
                          (import-file *tenant-conn* "mixed-column-counts.csv"
                                       {:dataset-name "Mixed Column Counts"})))))
