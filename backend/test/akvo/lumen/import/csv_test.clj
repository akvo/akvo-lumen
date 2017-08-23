(ns akvo.lumen.import.csv-test
  (:require [akvo.lumen.component.tenant-manager :refer [pool]]
            [akvo.lumen.fixtures :refer [;; db-fixture test-conn
                                         migrate-tenant rollback-tenant]]
            [akvo.lumen.import :refer [do-import]]
            [akvo.lumen.import.csv :refer :all]
            [akvo.lumen.test-utils :refer [import-file-2 test-tenant test-tenant-conn]]
            [akvo.lumen.util :refer [squuid]]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.java.io :as io]
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

(defn import-file
  "Import a file and return the dataset-id"
  [file {:keys [dataset-name has-column-headers?]}]
  (let [data-source-id (str (squuid))
        job-id (str (squuid))
        data-source-spec {"name" (or dataset-name file)
                          "source" {"path" (.getAbsolutePath (io/file (io/resource file)))
                                    "kind" "DATA_FILE"
                                    "fileName" (or dataset-name file)
                                    "hasColumnHeaders" (boolean has-column-headers?)}}]
    (insert-data-source *tenant-conn* {:id data-source-id :spec data-source-spec})
    (insert-job-execution *tenant-conn* {:id job-id :data-source-id data-source-id})
    (do-import *tenant-conn* {:file-upload-path "/tmp/akvo/dash"} job-id)
    (:dataset_id (dataset-id-by-job-execution-id *tenant-conn* {:id job-id}))))


(deftest ^:functional test-dos-file
  (testing "Import of DOS-formatted CSV file"
    (try
      (let [dataset-id (import-file-2 *tenant-conn* "dos.csv" {:dataset-name "DOS data"})
            dataset (dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id
                                                                  :version 1})]
        (is (= 2 (count (:columns dataset)))))
      (catch Exception e
        (.printStackTrace (.getCause e))))))

(deftest ^:functional test-mixed-columns
  (testing "Import of mixed-type data"
    (let [dataset-id (import-file-2 *tenant-conn* "mixed-columns.csv" {:dataset-name "Mixed Columns"})
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
                          (import-file-2 *tenant-conn* "mixed-column-counts.csv"
                                         {:dataset-name "Mixed Column Counts"})))))
