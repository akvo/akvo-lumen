(ns akvo.lumen.lib.aggregation-test
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         *error-tracker*
                                         error-tracker-fixture]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.transformation :as tf]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.test-utils :refer [import-file]]
            [clojure.tools.logging :as log]
            [clojure.walk :refer (keywordize-keys stringify-keys)]
            [clojure.test :refer :all]))

(use-fixtures :once tenant-conn-fixture error-tracker-fixture)

(deftest ^:functional pivot-tests
  (let [data {:columns
              [{:id :c1, :title "A", :type "text"}
               {:id :c2, :title "B", :type "text"}
               {:id :c3, :title "C", :type "text"}],
              :rows
              [[{:value "a1"} {:value "b1"} {:value "10"}]
               [{:value "a1"} {:value "b1"} {:value "11"}]
               [{:value "a1"} {:value "b2"} {:value "9"}]
               [{:value "a1"} {:value "b2"} {:value "10"}]
               [{:value "a2"} {:value "b1"} {:value "12"}]
               [{:value "a2"} {:value "b1"} {:value "10"}]
               [{:value "a2"} {:value "b2"} {:value "11"}]
               [{:value "a2"} {:value "b2"} {:value "10"}]]}
        dataset-id (import-file *tenant-conn* *error-tracker* {:dataset-name "pivot"
                                                               :kind "clj"
                                                               :data data})
        query (partial aggregation/query *tenant-conn* dataset-id "pivot") ]
    (tf/apply {:tenant-conn *tenant-conn*}
              dataset-id
              {:type :transformation
               :transformation {"op" "core/change-datatype"
                                "args" {"columnName" "c3"
                                        "newType" "number"
                                        "defaultValue" 0}
                                "onError" "default-value"}})
    (testing "Empty query"
      (let [[tag query-result :as res] (query {:aggregation "count"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:columns [{:type "number" :title "Total"}]
                             :rows [[8]]
                             :metadata {:categoryColumnTitle nil}}))))

    (testing "Empty query with filter"
      (let [[tag query-result] (query {:aggregation "count",
                                       :filters
                                       [{:column "c1", :value "a1", :operation "keep", :strategy "is"}]})]
        (is (= tag ::lib/ok))
        (is (= query-result {:columns [{:type "number" :title "Total"}]
                             :rows [[4]]
                             :metadata {:categoryColumnTitle nil}}))))

    (testing "Category column only"
      (let [[tag query-result] (query {:aggregation "count", :categoryColumn "c1"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:columns [{:title "" :type "text"}
                                       {:title "a1" :type "number"}
                                       {:title "a2" :type "number"}]
                             :rows [["Total" 4 4]]
                             :metadata {:categoryColumnTitle "A"}}))))

    (testing "Row Column Only"
      (let [[tag query-result] (query {:aggregation "count", :rowColumn "c2"})]
        (is (= tag ::lib/ok))
        (is (= query-result
               {:columns [{:type "text", :title "B"}
                          {:type "number", :title "Total"}],
                :rows [["b1" 4]
                       ["b2" 4]]
                :metadata {:categoryColumnTitle nil}}))))

    (testing "Row & Category Column with count aggregation"
      (let [[tag query-result] (query {:aggregation "count", :categoryColumn "c1", :rowColumn "c2"})]
        (is (= tag ::lib/ok))
        (is (= query-result
               {:columns [{:title "B", :type "text"}
                          {:title "a1", :type "number"}
                          {:title "a2", :type "number"}]
                :rows [["b1" 2.0 2.0]
                       ["b2" 2.0 2.0]]
                :metadata {:categoryColumnTitle "A"}}))))

    (testing "Row & Category Column with mean aggregation"
      (let [[tag query-result] (query {:aggregation "mean",
                                       :categoryColumn "c1",
                                       :rowColumn "c2",
                                       :valueColumn "c3"})]
        (is (= tag ::lib/ok))
        (is (= query-result
               {:columns [{:title "B", :type "text"}
                          {:title "a1", :type "number"}
                          {:title "a2", :type "number"}]
                :rows [["b1" 10.5 11.0]
                       ["b2" 9.5 10.5]]
                :metadata {:categoryColumnTitle "A"}}))))

    (testing "Row & Category Column with mean aggregation and filter"
      (let [[tag query-result] (query {:aggregation "mean",
                                       :categoryColumn "c1",
                                       :rowColumn "c2",
                                       :valueColumn "c3",
                                       :filters
                                       [{:column "c3",
                                         :value "11",
                                         :operation "remove",
                                         :strategy "isHigher"}]})]
        (is (= tag ::lib/ok))
        (is (= query-result
               {:columns [{:title "B" :type "text"}
                          {:title "a1" :type "number"}
                          {:title "a2" :type "number"}]
                :rows [["b1" 10.5 10.0]
                       ["b2" 9.5 10.5]]
                :metadata {:categoryColumnTitle "A"}}))))))

(deftest ^:functional pie-tests
  (let [data {:columns
              [{:id :c1, :title "A", :type "text"}
               {:id :c2, :title "B", :type "text"}],
              :rows
              [[{:value "a1"} {:value "b1"}]
               [{:value "a1"} {:value "b1"}]
               [{:value "a1"} {:value "b1"}]
               [{:value "a1"} {:value "b2"}]
               [{:value "a2"} {:value "b1"}]
               [{:value "a2"} {:value "b1"}]
               [{:value "a2"} {:value "b2"}]
               [{:value "a2"} {:value "b2"}]]}
        dataset-id (import-file *tenant-conn* *error-tracker* {:dataset-name "pie"
                                                               :kind "clj"
                                                               :data data})
        query (partial aggregation/query *tenant-conn* dataset-id "pie")]
    (testing "Simple queries"
      (let [[tag query-result] (query {:bucketColumn "c1"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:series [{:key "A", :label "A", :data [{:value 4} {:value 4}]}],
                             :common
                             {:data [{:key "a1", :label "a1"} {:key "a2", :label "a2"}],
                              :metadata {:type "text"}}})))

      (let [[tag query-result] (query {:bucketColumn "c2"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:series [{:key "B", :label "B", :data [{:value 5} {:value 3}]}],
                             :common
                             {:data [{:key "b1", :label "b1"} {:key "b2", :label "b2"}],
                              :metadata {:type "text"}}}))))))
