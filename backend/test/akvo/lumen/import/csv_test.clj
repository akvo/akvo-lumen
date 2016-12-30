(ns akvo.lumen.import.csv-test
  (:require [clojure.java.io :as io]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]
            [akvo.lumen.fixtures :refer [test-conn]]
            [akvo.lumen.import.csv :refer :all]
            [akvo.lumen.import :refer [do-import]]
            [akvo.lumen.util :refer [squuid]]))

(hugsql/def-db-fns "akvo/lumen/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/transformation.sql")


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
    (insert-data-source test-conn {:id data-source-id :spec data-source-spec})
    (insert-job-execution test-conn {:id job-id :data-source-id data-source-id})
    (do-import test-conn {:file-upload-path "/tmp/akvo/dash"} job-id)
    (:dataset_id (dataset-id-by-job-execution-id test-conn {:id job-id}))))

(deftest test-util-functions
  (testing "SQL generation"
    (is (= "CREATE TEMP TABLE uuid1 (rnum serial primary key, c1 text, c2 text, c3 text)"
           (get-create-table-sql "uuid1" 3 "text" true)))
    (is (= "CREATE TABLE uuid2 (rnum integer primary key, c1 jsonb, c2 jsonb, c3 jsonb)"
           (get-create-table-sql "uuid2" 3 "jsonb" false)))
    (is (= "COPY uuid1 (c1, c2, c3) FROM STDIN WITH (FORMAT CSV, ENCODING 'UTF-8')"
           (get-copy-sql "uuid1" 3 false "UTF-8")))
    (is (= "COPY uuid2 (c1, c2, c3) FROM STDIN WITH (FORMAT CSV, ENCODING 'ISO-8859-1', HEADER true)"
           (get-copy-sql "uuid2" 3 true "ISO-8859-1")))
    (is (= "INSERT INTO uuid1 (rnum, c1, c2) SELECT rnum, to_json(replace(c1, '\\', '\\\\'))::jsonb, to_json(replace(c2, '\\', '\\\\'))::jsonb FROM t_uuid1"
           (get-insert-sql "t_uuid1" "uuid1" 2)))
    (is (= 19 (get-num-cols (io/file (io/resource "artist")) \tab "UTF-8")))
    (is (= 23 (get-num-cols (io/file (io/resource "products")) \, "UTF-8")))
    (is (= 60 (get-num-cols (io/file (io/resource "rural-population")) \, "UTF-8")))))

(deftest ^:functional test-dos-file
  (testing "Import of DOS-formatted CSV file"
    (let [dataset-id (import-file "dos.csv" {:dataset-name "DOS data"})
          dataset (dataset-version-by-dataset-id test-conn {:dataset-id dataset-id
                                                            :version 1})]
      (is (= 2 (count (:columns dataset)))))))
