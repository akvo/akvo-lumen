(ns org.akvo.dash.transformation-test
  (:require [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.fixtures :refer (test-conn
                                            test-tenant-spec
                                            migrate-tenant
                                            rollback-tenant)]
            [org.akvo.dash.transformation :as tf]))

(def ops (vec (json/parse-string (slurp (io/resource "ops.json")))))
(def invalid-op (-> (take 3 ops)
                    vec
                    (update-in [1 "args"] dissoc "parseFormat")))

(hugsql/def-db-fns "org/akvo/dash/transformation_test.sql")


(defn test-fixture
  [f]
  (rollback-tenant test-tenant-spec)
  (migrate-tenant test-tenant-spec)
  (rollback-test-data test-conn)
  (new-test-table test-conn)
  (new-test-data test-conn)
  (f))

(use-fixtures :once test-fixture)

(deftest op-validation
  (testing "op validation"
    (is (= true (:valid? (tf/validate ops))))
    (let [result (tf/validate invalid-op)]
      (is (= false (:valid? result)))
      (is (= (format "Invalid operation %s" (second invalid-op)) (:message result))))))

(deftest ^:functional test-transformations
  (testing "Transformation application"
    (is (= {:status 400 :body {:message "Dataset not found"}}
           (tf/schedule test-conn "Not-valid-id" []))))
  (testing "Valid log"
    (let [resp (tf/schedule test-conn "ds-1" ops)]
      (is (= 200 (:status resp))))))
