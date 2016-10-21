(ns org.akvo.lumen.import.csv-test
  (:require [clojure.java.io :as io]
            [clojure.test :refer :all]
            [org.akvo.lumen.import.csv :refer :all])
  (:import org.apache.commons.io.input.UnixLineEndingInputStream))


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

(deftest test-unix-line-endings
  (testing "Import file with DOS line endings"
    (with-open [stream (-> (io/input-stream (io/resource "dos.csv"))
                           (UnixLineEndingInputStream. true))
                raw-csv (. stream read)])))


