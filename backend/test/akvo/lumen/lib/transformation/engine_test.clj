(ns akvo.lumen.lib.transformation.engine-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [migrate-tenant rollback-tenant summarise-transformation-logs-fixture]]
            [akvo.lumen.test-utils :refer [test-tenant test-tenant-conn]]
            [akvo.lumen.lib.transformation.engine :refer :all]
            [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]))

(def try-apply-operation #'akvo.lumen.lib.transformation.engine/try-apply-operation)

(hugsql/def-db-fns "akvo/lumen/lib/transformation/engine_test.sql")

(def columns (vec (take 3 (json/parse-string (slurp (io/resource "columns_test.json"))))))

(def ^:dynamic *tenant-conn*)

(defn fixture [f]
  (migrate-tenant test-tenant)
  (binding [*tenant-conn* (test-tenant-conn test-tenant)]
    (db-drop-test-table *tenant-conn*)
    (db-test-table *tenant-conn*)
    (db-test-data *tenant-conn*)
    (f)
    (rollback-tenant test-tenant)))

(use-fixtures :once fixture summarise-transformation-logs-fixture)

(def transformations
  {:ops [{"op" "core/to-titlecase"
          "args" {"columnName" "c1"}
          "onError" "default-value"}
         {"op" "core/change-datatype"
          "args" {"columnName" "c2"
                  "newType" "number"
                  "defaultValue" 0}
          "onError" "default-value"}
         {"op" "core/change-datatype"
          "args" {"columnName" "c3"
                  "newType" "date"
                  "defaultValue" 0
                  "parseFormat" "YYYY-MM-DD"}
          "onError" "default-value"}]
   :filter-column [{"op" "core/filter-column"
                    "args" {"columnName" "c1"
                            "expression" {"is" "akvo"}}
                    "onError" "fail"}
                   {"op" "core/filter-column"
                    "args" {"columnName" "c1"
                            "expression" {"contains" "FOUNDATION"}}}]
   :to-number {"op" "core/change-datatype"
               "args" {"columnName" "c1"
                       "newType" "number"
                       "defaultValue" 0}
               "onError" "fail"}
   :to-date {"op" "core/change-datatype"
             "args" {"columnName" "c1"
                     "newType" "date"
                     "defaultValue" 0
                     "parseFormat" "YYYY-MM-DD"}
             "onError" "fail"}
   :sort-column {"op" "core/sort-column"
                 "args" {"columnName" "c1"
                         "sortDirection" "ASC"}
                 "onError" "fail"}
   :remove-sort {"op" "core/remove-sort"
                 "args" {"columnName" "c1"}
                 "onError" "fail"}
   :change-title {"op" "core/change-column-title"
                  "args" {"columnName" "c2"
                          "columnTitle" "My column"}
                  "onError" "fail"}
   :extract-multiple-column {"args"
                              {"columnName" "c11",
                               "columns"
                               [{"extract" true, "id" 1, "name" "title 1", "type" "text"}
                                {"extract" false, "id" 2, "name" "title 2", "type" "text"}],
                               "extractImage" false,
                               "selectedColumn"
                               {"columnName" "c11",
                                "direction" nil,
                                "hidden" false,
                                "sort" nil,
                                "title" "Column 11",
                                "type" "multiple"}},
                              "onError" "fail",
                              "op" "core/extract-multiple"}})

(deftest ^:functional test-transformations
  (testing "Valid data"
    (let [ops (:ops transformations)]
      (is (every? :success? (for [op ops]
                              (try-apply-operation {:tenant-conn *tenant-conn*} "ds_test_1" columns op))))))

  (testing "Filter column (text)"
    (let [ops (:filter-column transformations)
          filter-using-is (first ops)
          filter-using-contains (second ops)]

      (db-delete-test-data *tenant-conn*)
      (db-test-data *tenant-conn*)

      (is (= true (:success? (try-apply-operation {:tenant-conn *tenant-conn*} "ds_test_1" columns filter-using-is))))

      (let [result (db-select-test-data *tenant-conn*)]
        (is (= 1 (count result)))
        (is (= "akvo" (:c1 (first result)))))

      (db-delete-test-data *tenant-conn*)
      (db-test-data *tenant-conn*)

      (is (= true (:success? (try-apply-operation {:tenant-conn *tenant-conn*} "ds_test_1" columns filter-using-contains))))

      (let [result (db-select-test-data *tenant-conn*)]
        (is (= 1 (count result)))
        (is (= "akvo foundation" (:c1 (first result)))))))

  (testing "Invalid data, on-error: fail"
    (let [op-to-number (:to-number transformations)
          op-to-date (:to-date transformations)]

      (db-delete-test-data *tenant-conn*)
      (db-insert-invalid-data *tenant-conn*)

      (is (not (:success? (try-apply-operation {:tenant-conn *tenant-conn*} "ds_test_1" columns op-to-number))))
      (is (not (:success? (try-apply-operation {:tenant-conn *tenant-conn*} "ds_test_1" columns op-to-date))))))

  (testing "Invalid data, on-error: default-value"
    (let [op1 (assoc (:to-number transformations) "onError" "default-value")
          op2 (assoc (:to-date transformations) "onError" "default-value")]

      (db-delete-test-data *tenant-conn*)
      (db-insert-invalid-data *tenant-conn*)

      (let [result (try-apply-operation {:tenant-conn *tenant-conn*} "ds_test_1" columns op1)
            data (db-select-test-data *tenant-conn*)]
        (is (:success? result))
        (is (= 1 (count data)))
        (is (zero? (:c1 (first data))))))))
