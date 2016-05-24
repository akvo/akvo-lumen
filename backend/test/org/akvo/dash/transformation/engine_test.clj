(ns org.akvo.dash.transformation.engine-test
  (:require [clojure.test :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.migrate :as migrate]
            [reloaded.repl :refer [system stop go]]
            [org.akvo.dash.transformation.engine :refer :all]
            [user :refer [config]]))

(hugsql/def-db-fns "org/akvo/dash/transformation/engine_test.sql")

(def tenant-conn {:connection-uri "jdbc:postgresql://localhost/test_dash_tenant_1?user=dash&password=password"})

(defn transformation-fixture
  [f]
  (migrate/do-migrate "org/akvo/dash/migrations_tenants" tenant-conn)
  (db-test-table tenant-conn)
  (db-test-data tenant-conn)
  (f)
  (db-drop-test-table tenant-conn))

(use-fixtures :once transformation-fixture)

(def transformations
  {:ops [{"op" "core/to-titlecase"
                "args" {"columnName" "c1"}
                "onError" "default-value"}
               {"op" "core/change-datatype"
                "args" {"columnName" "c2"
                        "newType" "number"
                        "defaultValue" "0"}
                "onError" "default-value"}
               {"op" "core/change-datatype"
                "args" {"columnName" "c3"
                        "newType" "date"
                        "defaultValue" "0"}
                "onError" "default-value"}]
   :to-number {"op" "core/change-datatype"
               "args" {"columnName" "c1"
                       "newType" "number"
                       "defaultValue" "0"}
               "onError" "fail"}
   :to-date {"op" "core/change-datatype"
             "args" {"columnName" "c1"
                     "newType" "date"
                     "defaultValue" "0"
                     "parseFormat" "YYYY-MM-DD"}
             "onError" "fail"}})

(deftest ^:functional test-transformations
  (testing "Valid data"
    (let [ops (:ops transformations)]
      (is (every? :success? (for [op ops]
                              (apply-operation tenant-conn "ds_test_1" {} op))))))

  (testing "Invalid data, on-error: fail"
    (let [op-to-number (:to-number transformations)
          op-to-date (:to-date transformations)]

      (db-delete-test-data tenant-conn)
      (db-insert-invalid-data tenant-conn)

      (is (not (:success? (apply-operation tenant-conn "ds_test_1" {} op-to-number))))
      (is (not (:success? (apply-operation tenant-conn "ds_test_1" {} op-to-date))))))

  (testing "Invalid data, on-error: default-value"
    (let [op1 (assoc (:to-number transformations) "onError" "default-value")
          op2 (assoc (:to-date transformations) "onError" "default-value")]

      (db-delete-test-data tenant-conn)
      (db-insert-invalid-data tenant-conn)

      (let [result (apply-operation tenant-conn "ds_test_1" {} op1)
            data (db-select-test-data tenant-conn)]
        (is (:success? result))
        (is (= 1 (count data)))
        (is (zero? (:c1 (first data)))))


      (db-delete-test-data tenant-conn)
      (db-insert-invalid-data tenant-conn)

      (let [result (apply-operation tenant-conn "ds_test_1" {} op2)
            data (db-select-test-data tenant-conn)]
        (is (:success? result))
        (is (= 1 (count data)))
        (is (zero? (:c1 (first data)))))))

  (testing "Invalid data, on-error: delete-row"
    (let [op1 (assoc (:to-number transformations) "onError" "delete-row")
          op2 (assoc (:to-date transformations) "onError" "delete-row")]

      (db-delete-test-data tenant-conn)
      (db-insert-invalid-data tenant-conn)

      (let [result (apply-operation tenant-conn "ds_test_1" {} op1)
            data (db-select-test-data tenant-conn)]
        (is (:success? result))
        (is (zero? (count data))))

      (db-delete-test-data tenant-conn)
      (db-insert-invalid-data tenant-conn)

      (let [result (apply-operation tenant-conn "ds_test_1" {} op2)
            data (db-select-test-data tenant-conn)]
        (is (:success? result))
        (is (zero? (count data)))))))
