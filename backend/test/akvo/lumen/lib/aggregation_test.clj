(ns akvo.lumen.lib.aggregation-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         *error-tracker*
                                         error-tracker-fixture]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.transformation :as tf]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.test-utils :as tu]
            [akvo.lumen.test-utils :refer [import-file update-file]]
            [clojure.tools.logging :as log]
            [clojure.walk :refer (keywordize-keys stringify-keys)]
            [clojure.test :refer :all]))

(use-fixtures :once tu/spec-instrument tenant-conn-fixture error-tracker-fixture)

(defn query* [t dataset-id]
  (fn [q]
    (let [q (if (:filters q) q (assoc q :filters []))]
      (aggregation/query *tenant-conn* dataset-id t q))))

(deftest pivot-tests
  (let [columns [{:id "c1", :title "A", :type "text"}
                 {:id "c2", :title "B", :type "text"}
                 {:id "c3", :title "C", :type "number"}]
        rows [[{:value "a1"} {:value "b1"} {:value 10}]
               [{:value "a1"} {:value "b1"} {:value 11}]
               [{:value "a1"} {:value "b2"} {:value 9}]
               [{:value "a1"} {:value "b2"} {:value 10}]]
        data {:columns columns :rows rows}
        [job dataset] (import-file *tenant-conn* *error-tracker* {:dataset-name "pivot"
                                                                  :kind "clj"
                                                                  :data data
                                                                  :with-job? true})
        dataset-id (:dataset_id job)
        data-source-id (:data_source_id job)
        query  (query* "pivot" dataset-id)]

    (testing "Empty query"
      (let [[tag query-result :as res] (query {:aggregation "count"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:columns [{:type "number" :title "Total"}]
                             :rows [[4]]
                             :metadata {:categoryColumnTitle nil}})))


      (update-file *tenant-conn* *error-tracker* dataset-id data-source-id
                   {:kind "clj"
                    :data {:columns columns
                           :rows (conj rows
                                       [{:value "a2"} {:value "b1"} {:value 12}]
                                       [{:value "a2"} {:value "b1"} {:value 10}]
                                       [{:value "a2"} {:value "b2"} {:value 11}]
                                       [{:value "a2"} {:value "b2"} {:value 10}])}})

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

(deftest pie-tests
  (let [data {:columns
              [{:id "c1", :title "A", :type "text"}
               {:id "c2", :title "B", :type "text"}],
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
        query (query* "pie" dataset-id)]
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

(deftest bar-tests
  (let [data {:columns [{:id "c1", :title "A", :type "text"}
                            {:id "c2", :title "B", :type "number"}
                            {:id "c3", :title "C", :type "number"}]
                  :rows    [[{:value "a"} {:value 1} {:value 1}]
                            [{:value "b"} {:value 1} {:value 2}]
                            [{:value "c"} {:value 1} {:value 3}]
                            [{:value "c"} {:value 1} {:value 4}]]}
        dataset-id (import-file *tenant-conn* *error-tracker* {:dataset-name "bar"
                                                               :kind "clj"
                                                               :data data})
        query (query* "bar" dataset-id)]
    (testing "Simple queries"
      (let [[tag query-result] (query {:bucketColumn "c1"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:series
                             [{:key nil, :label nil, :data [{:value 1} {:value 1} {:value 2}]}],
                             :common
                             {:metadata {:type "text"},
                              :data
                              [{:label "a", :key "a"}
                               {:label "b", :key "b"}
                               {:label "c", :key "c"}]}})))

      (let [[tag query-result] (query {:bucketColumn "c2"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:series [{:key nil, :label nil, :data [{:value 4}]}],
                             :common
                             {:metadata {:type "number"}, :data [{:label 1.0, :key 1.0}]}}))))
    (testing "aggregation types with metric column"
      (let [[tag query-result] (query {:bucketColumn "c1"
                                       :metricAggregation "min"
                                       :metricColumnY "c3"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:series
                             [{:key "C",
                               :label "C",
                               :data [{:value 1.0} {:value 2.0} {:value 3.0}]}],
                             :common
                             {:metadata {:type "text"},
                              :data
                              [{:label "a", :key "a"}
                               {:label "b", :key "b"}
                               {:label "c", :key "c"}]}})))
      (let [[tag query-result] (query {:bucketColumn "c1"
                                       :metricAggregation "max"
                                       :metricColumnY "c3"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:series
                             [{:key "C",
                               :label "C",
                               :data [{:value 1.0} {:value 2.0} {:value 4.0}]}],
                             :common
                             {:metadata {:type "text"},
                              :data
                              [{:label "a", :key "a"}
                               {:label "b", :key "b"}
                               {:label "c", :key "c"}]}}))))
    (testing "aggregation types with metric column and subbucket-column"
      (let [[tag query-result] (query {:bucketColumn "c1"
                                       :metricAggregation "max"
                                       :metricColumnY "c3"
                                       :subBucketColumn "c3"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:series
                             [{:key 1.0, :label 1.0, :data '({:value 1.0} {:value 0} {:value 0})}
                              {:key 2.0, :label 2.0, :data '({:value 0} {:value 2.0} {:value 0})}
                              {:key 3.0, :label 3.0, :data '({:value 0} {:value 0} {:value 3.0})}
                              {:key 4.0, :label 4.0, :data '({:value 0} {:value 0} {:value 4.0})}],
                             :common
                             {:metadata {:type "text"},
                              :data
                              [{:label "a", :key "a"}
                               {:label "b", :key "b"}
                               {:label "c", :key "c"}]}}))))))
