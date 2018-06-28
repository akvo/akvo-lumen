(ns akvo.lumen.lib.pivot-test
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         *error-tracker*
                                         error-tracker-fixture]]
            [akvo.lumen.utils.specs]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.test-utils :refer [import-file instrument-fixture with-instrument-disabled]]
            [akvo.lumen.transformation :as tf]
            [clojure.test :refer :all]
            [clojure.walk :refer (keywordize-keys)]))

(use-fixtures :once tenant-conn-fixture error-tracker-fixture instrument-fixture)

(deftest ^:functional test-pivot
  (let [dataset-id (import-file *tenant-conn* *error-tracker* "pivot.csv" {:dataset-name "pivot"
                                                                           :has-column-headers? true})
        query (partial aggregation/query *tenant-conn* dataset-id "pivot")]
    (tf/apply *tenant-conn*
              dataset-id
              {::tf/type :transformation
               :transformation (keywordize-keys
                                {"akvo.lumen.transformation.engine/op" "core/change-datatype"
                                 "args" {"columnName" "c3"
                                         "newType" "number"
                                         "defaultValue" 0}
                                 "onError" "default-value"})})
    (testing "Empty query"
      (let [[tag query-result] (query {"aggregation" "count"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:columns [{:type "number" :title "Total"}]
                             :rows [[8]]
                             :metadata {:categoryColumnTitle nil}}))))

    (testing "Empty query with filter"
      (let [[tag query-result] (query {"aggregation" "count"
                                       "filters" [{"column" "c1"
                                                   "value" "a1"
                                                   "operation" "keep"
                                                   "strategy" "is"}]})]
        (is (= tag ::lib/ok))
        (is (= query-result {:columns [{:type "number" :title "Total"}]
                             :rows [[4]]
                             :metadata {:categoryColumnTitle nil}}))))

    (testing "Category column only"
      (let [[tag query-result] (query {"aggregation" "count"
                                       "categoryColumn" "c1"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:columns [{:title "" :type "text"}
                                       {:title "a1" :type "number"}
                                       {:title "a2" :type "number"}]
                             :rows [["Total" 4 4]]
                             :metadata {:categoryColumnTitle "A"}}))))

    (testing "Row Column Only"
      (let [[tag query-result] (query {"aggregation" "count"
                                       "rowColumn" "c2"})]
        (is (= tag ::lib/ok))
        (is (= query-result
               {:columns [{:type "text", :title "B"}
                          {:type "number", :title "Total"}],
                :rows [["b1" 4]
                       ["b2" 4]]
                :metadata {:categoryColumnTitle nil}}))))

    (testing "Row & Category Column with count aggregation"
      (let [[tag query-result] (query {"aggregation" "count"
                                       "categoryColumn" "c1"
                                       "rowColumn" "c2"})]
        (is (= tag ::lib/ok))
        (is (= query-result
               {:columns [{:title "B", :type "text"}
                          {:title "a1", :type "number"}
                          {:title "a2", :type "number"}]
                :rows [["b1" 2.0 2.0]
                       ["b2" 2.0 2.0]]
                :metadata {:categoryColumnTitle "A"}}))))

    (testing "Row & Category Column with mean aggregation"
      (let [[tag query-result] (query {"aggregation" "mean"
                                       "categoryColumn" "c1"
                                       "rowColumn" "c2"
                                       "valueColumn" "c3"})]
        (is (= tag ::lib/ok))
        (is (= query-result
               {:columns [{:title "B", :type "text"}
                          {:title "a1", :type "number"}
                          {:title "a2", :type "number"}]
                :rows [["b1" 10.5 11.0]
                       ["b2" 9.5 10.5]]
                :metadata {:categoryColumnTitle "A"}}))))

    (testing "Row & Category Column with mean aggregation and filter"
      (let [[tag query-result] (query {"aggregation" "mean"
                                       "categoryColumn" "c1"
                                       "rowColumn" "c2"
                                       "valueColumn" "c3"
                                       "filters" [{"column" "c3"
                                                   "value" "11"
                                                   "operation" "remove"
                                                   "strategy" "isHigher"}]})]
        (is (= tag ::lib/ok))
        (is (= query-result
               {:columns [{:title "B" :type "text"}
                          {:title "a1" :type "number"}
                          {:title "a2" :type "number"}]
                :rows [["b1" 10.5 10.0]
                       ["b2" 9.5 10.5]]
                :metadata {:categoryColumnTitle "A"}}))))))
