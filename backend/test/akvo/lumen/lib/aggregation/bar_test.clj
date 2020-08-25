(ns akvo.lumen.lib.aggregation.bar-test
  (:require [akvo.lumen.lib.aggregation.bar :as bar]
            [clojure.tools.logging :as log]
            [clojure.test :refer :all]))

(deftest ^:unit subbucket-response-test
  (let [sql-data [["Agriculture"  145.0 "B" 183.0]
                  ["Agriculture"  38.0 "C" 183.0]
                  ["Education"  52.0 "A" 284.0]
                  ["Education"  87.0 "B" 284.0]
                  ["Education"  145.0 "C" 284.0]
                  ["Other"  61.0 "B" 101.0]
                  ["Other"  40.0 "A" 101.0]
                  ["WASH"  107.0 "C" 213.0]
                  ["WASH"  46.0 "B" 213.0]
                  ["WASH"  60.0 "A" 213.0]]
        subbucket-column {:type "text"}]
    (is (= (bar/subbucket-column-response sql-data subbucket-column)
           {:series
	    [{:key "B",
	      :label "B",
	      :data '({:value 145.0} {:value 87.0} {:value 61.0} {:value 46.0})}
	     {:key "C",
	      :label "C",
	      :data '({:value 38.0} {:value 145.0} {:value 0} {:value 107.0})}
	     {:key "A",
	      :label "A",
	      :data '({:value 0} {:value 52.0} {:value 40.0} {:value 60.0})}],
	    :common
	    {:metadata {:type "text"},
	     :data
	     '({:label "Agriculture", :key "Agriculture"}
	       {:label "Education", :key "Education"}
	       {:label "Other", :key "Other"}
	       {:label "WASH", :key "WASH"})}}))))

(deftest ^:unit metrics-response-test
  (let [sql-data [["Agriculture"  183.0 167.0 167.0]
                  ["Education"  284.0 290.0 290.0]
                  ["Other"  101.0 87.0 87.0]
                  ["WASH"  213.0 219.0 219.0]]
        bucket-column {:type "text"}
        metrics-columns [{:title "title 1"} {:title "title 2"}]]
    (is (= (bar/metrics-column-response sql-data bucket-column metrics-columns)
           {:series
	    [{:key "title 1",
	      :label "title 1",
	      :data '({:value 183.0} {:value 284.0} {:value 101.0} {:value 213.0})}
	     {:key "title 2",
	      :label "title 2",
	      :data
	      '({:value 167.0} {:value 290.0} {:value 87.0} {:value 219.0})}],
	    :common
	    {:metadata {:type "text"},
	     :data
	     '({:key "Agriculture", :label "Agriculture"}
	       {:key "Education", :label "Education"}
	       {:key "Other", :label "Other"}
	       {:key "WASH", :label "WASH"})}}))))
