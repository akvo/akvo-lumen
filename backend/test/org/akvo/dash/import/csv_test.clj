(ns org.akvo.dash.import.csv-test
  (:require [clojure.java.io :as io]
            [clojure.test :refer :all]
            [org.akvo.dash.import.csv :refer :all]))


(deftest test-util-functions
  (testing "SQL generation"
    (is (= "CREATE TEMP TABLE uuid1 (serial rnum, c1 text, c2 text, c3 text)"
           (get-create-table-sql "uuid1" 3 "text" true)))
    (is (= "CREATE TABLE uuid2 (integer rnum, c1 jsonb, c2 jsonb, c3 jsonb)"
           (get-create-table-sql "uuid2" 3 "jsonb" false)))
    (is (= "COPY uuid1 (c1, c2, c3) FROM STDIN WITH (FORMAT CSV)"
           (get-copy-sql "uuid1" 3 false)))
    (is (= "COPY uuid2 (c1, c2, c3) FROM STDIN WITH (FORMAT CSV, HEADER true)"
           (get-copy-sql "uuid2" 3 true)))
    (is (= "INSERT INTO uuid1 (rnum, c1, c2) SELECT rnum, to_jsonb(replace(c1, '\\', '\\\\')), to_jsonb(replace(c2, '\\', '\\\\')) FROM t_uuid1"
           (get-insert-sql "t_uuid1" "uuid1" 2)))
    (is (= 19 (get-num-cols (io/file (io/resource "artist")) \tab)))
    (is (= 23 (get-num-cols (io/file (io/resource "products")) \,)))
    (is (= 60 (get-num-cols (io/file (io/resource "rural-population")) \,)))))
