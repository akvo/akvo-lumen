(ns akvo.lumen.lib.aggregation.scatter-test
  (:require [akvo.lumen.lib.aggregation.scatter :as scatter]
            [clojure.tools.logging :as log]
            [clojure.test :refer :all]))

(deftest ^:unit serie-test
  (let [sql-data [[:a0 :b0 :c0 :d0 :e0] [:a1 :b1 :c1 :d1 :e1]]
        column {:title "c1"
                :type "text"}]
    (is (= (scatter/serie sql-data column 0)
           {:key (:title column),
            :label (:title column),
            :data [{:value :a0 :key :a0} {:value :a1 :key :a1}],
            :metadata {:type (:type column)}}))
    (is (= (scatter/serie sql-data column 1)
           {:key (:title column),
            :label (:title column),
            :data [{:value :b0 :key :b0} {:value :b1 :key :b1}],
            :metadata {:type (:type column)}}))))
