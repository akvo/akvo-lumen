(ns akvo.lumen.lib.pivot-test
  (:require [akvo.lumen.component.tenant-manager :refer [tenant-manager]]
            [akvo.lumen.component.transformation-engine :refer [transformation-engine]]
            [akvo.lumen.fixtures :refer [test-tenant-spec
                                         migrate-tenant
                                         rollback-tenant]]
            [akvo.lumen.import.csv-test :refer [import-file]]
            [akvo.lumen.lib.pivot :as pivot]
            [akvo.lumen.transformation :as tf]
            [clojure.test :refer :all]
            [com.stuartsierra.component :as component]
            [duct.component.hikaricp :refer [hikaricp]]))

(def test-system
  (->
   (component/system-map
    :transformation-engine (transformation-engine {})
    :tenant-manager (tenant-manager {})
    :db (hikaricp {:uri (:db_uri test-tenant-spec)}))
   (component/system-using
    {:transformation-engine [:tenant-manager]
     :tenant-manager [:db]})))

(def ^:dynamic *tenant-conn*)
(def ^:dynamic *dataset-id*)

(defn fixture [f]
  (migrate-tenant test-tenant-spec)
  (alter-var-root #'test-system component/start)
  (binding [*tenant-conn* (:spec (:db test-system))
            *dataset-id* (import-file "pivot.csv" {:dataset-name "pivot"
                                                   :has-column-headers? true})]
    (tf/schedule *tenant-conn*
                 (:transformation-engine test-system)
                 *dataset-id*
                 {:type :transformation
                  :transformation {"op" "core/change-datatype"
                                   "args" {"columnName" "c3"
                                           "newType" "number"
                                           "defaultValue" 0}
                                   "onError" "default-value"}})
    (f)
    (alter-var-root #'test-system component/stop)
    (rollback-tenant test-tenant-spec)))

(use-fixtures :once fixture)

(deftest ^:functional test-pivot
  (let [query (partial pivot/query *tenant-conn* *dataset-id*)]
    (testing "Empty query"
      (let [{:keys [status body]} (query {"aggregation" "count"})]
        (is (= status 200))
        (is (= body {:columns [{"type" "number" "title" "Total"}]
                     :rows [[8]]}))))

    (testing "Empty query with filter"
      (let [{:keys [status body]} (query {"aggregation" "count"
                                          "filters" [{"column" "c1"
                                                      "value" "a1"
                                                      "operation" "keep"
                                                      "strategy" "is"}]})]
        (is (= status 200))
        (is (= body {:columns [{"type" "number" "title" "Total"}]
                     :rows [[4]]}))))

    (testing "Category column only"
      (let [{:keys [status body]} (query {"aggregation" "count"
                                          "categoryColumn" "c1"})]
        (is (= status 200))
        (is (= body {:columns [{"title" "" "type" "text"}
                               {"title" "a1" "type" "number"}
                               {"title" "a2" "type" "number"}]
                     :rows [["Total" 4 4]]}))))

    (testing "Row Column Only"
      (let [{:keys [status body]} (query {"aggregation" "count"
                                          "rowColumn" "c2"})]
        (is (= status 200))
        (is (= body
               {:columns [{"type" "text", "title" "B"}
                          {"type" "number", "title" "Total"}],
                :rows [["b1" 4]
                       ["b2" 4]]}))))

    (testing "Row & Category Column with count aggregation"
      (let [{:keys [status body]} (query {"aggregation" "count"
                                          "categoryColumn" "c1"
                                          "rowColumn" "c2"})]
        (is (= status 200))
        (is (= body
               {:columns [{"title" "B", "type" "text"}
                          {"title" "a1", "type" "number"}
                          {"title" "a2", "type" "number"}]
                :rows [["b1" 2.0 2.0]
                       ["b2" 2.0 2.0]]}))))

    (testing "Row & Category Column with mean aggregation"
      (let [{:keys [status body]} (query {"aggregation" "mean"
                                          "categoryColumn" "c1"
                                          "rowColumn" "c2"
                                          "valueColumn" "c3"})]
        (is (= status 200))
        (is (= body
               {:columns [{"title" "B", "type" "text"}
                          {"title" "a1", "type" "number"}
                          {"title" "a2", "type" "number"}]
                :rows [["b1" 10.5 11.0]
                       ["b2" 9.5 10.5]]}))))

    (testing "Row & Category Column with mean aggregation and filter"
      (let [{:keys [status body]} (query {"aggregation" "mean"
                                          "categoryColumn" "c1"
                                          "rowColumn" "c2"
                                          "valueColumn" "c3"
                                          "filters" [{"column" "c3"
                                                      "value" "11"
                                                      "operation" "remove"
                                                      "strategy" "isHigher"}]})]
        (is (= status 200))
        (is (= body
               {:columns [{"title" "B" "type" "text"}
                          {"title" "a1" "type" "number"}
                          {"title" "a2" "type" "number"}]
                :rows [["b1" 10.5 10.0]
                       ["b2" 9.5 10.5]]}))))))
