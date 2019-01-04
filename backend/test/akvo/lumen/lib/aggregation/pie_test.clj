(ns akvo.lumen.lib.aggregation.pie-test
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         *error-tracker*
                                         error-tracker-fixture]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.test-utils :refer [import-file]]
            [clojure.test :refer :all]))

(use-fixtures :once tenant-conn-fixture error-tracker-fixture)

(deftest ^:functional test-pie
  (let [dataset-id (import-file *tenant-conn* *error-tracker*  {:file "pie.csv"
                                                                :dataset-name "pie"
                                                                :has-column-headers? true})
        query (partial aggregation/query *tenant-conn* dataset-id "pie")]
    (testing "Simple queries"
      (let [[tag query-result] (query {"bucketColumn" "c1"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:series [{:key "A", :label "A", :data [{:value 4} {:value 4}]}],
                             :common
                             {:data [{:key "a1", :label "a1"} {:key "a2", :label "a2"}],
                              :metadata {:type "text"}}})))

      (let [[tag query-result] (query {"bucketColumn" "c2"})]
        (is (= tag ::lib/ok))
        (is (= query-result {:series [{:key "B", :label "B", :data [{:value 5} {:value 3}]}],
                             :common
                             {:data [{:key "b1", :label "b1"} {:key "b2", :label "b2"}],
                              :metadata {:type "text"}}}))))))
