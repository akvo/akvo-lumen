(ns akvo.lumen.lib.pie-test
  (:require [akvo.lumen.fixtures :refer [migrate-tenant rollback-tenant]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.test-utils
             :refer
             [import-file test-tenant test-tenant-conn]]
            [clojure.test :refer :all]))

(def ^:dynamic *tenant-conn*)

(defn fixture [f]
  (migrate-tenant test-tenant)
  (binding [*tenant-conn* (test-tenant-conn test-tenant)]
    (f)
    (rollback-tenant test-tenant)))

(use-fixtures :once fixture)

(deftest ^:functional test-pie
  (let [dataset-id (import-file *tenant-conn* "pie.csv" {:dataset-name "pie"
                                                           :has-column-headers? true})
        query (partial aggregation/query *tenant-conn* dataset-id "pie")]
    (testing "Simple queries"
      (let [[tag query-result] (query {"bucketColumn" "c1"})]
        (is (= tag ::lib/ok))
        (is (= query-result {"metadata" {"bucketColumnTitle" "A"
                                         "bucketColumnType" "text"},
                             "data" [{"bucketValue" "a1", "bucketCount" 4}
                                     {"bucketValue" "a2", "bucketCount" 4}]})))

      (let [[tag query-result] (query {"bucketColumn" "c2"})]
        (is (= tag ::lib/ok))
        (is (= query-result {"metadata" {"bucketColumnTitle" "B"
                                         "bucketColumnType" "text"},
                             "data" [{"bucketValue" "b1", "bucketCount" 5}
                                     {"bucketValue" "b2", "bucketCount" 3}]}))))))
