(ns akvo.lumen.lib.transformation.split-column-test
  (:require [akvo.lumen.endpoint.split-column :as e.split-column]
            [akvo.lumen.lib.transformation.split-column :as split-column]
            [clojure.test :refer :all]))

(deftest ^:unit pattern-test
  (is (= {"a" 1} (frequencies (re-seq (re-pattern "a") "a"))))

  (is (= {"a" 2, "b" 4} (frequencies (re-seq (re-pattern "a|b") "avalubbbbe")))))

(deftest ^:unit pattern-analysis-test
  (let [res (split-column/pattern-analysis (re-pattern "a|b") ["avalubbbbe" "avalue" "avalaaauasabe"])
        analysis (:analysis res)
        rows (:rows res)]
    (is (= {"a"
	    {:max-coincidences-in-one-row 7,
	     :total-row-coincidences 3,
	     :total-column-coincidences 11},
	    "b"
	    {:max-coincidences-in-one-row 4,
	     :total-row-coincidences 2,
	     :total-column-coincidences 5}} (:analysis res)))
    (is (= '["a" "b"] (e.split-column/sort-pattern-analysis-by res :total-row-coincidences)))))


(deftest ^:unit split-test
  (is (= '("" "" "") (split-column/split nil (re-pattern "a") 3)))
  (is (= '("" "" "") (split-column/split "" (re-pattern "a") 3)))
  (is (= '("" "" "") (split-column/split "a" (re-pattern "a") 3)))
  (is (= '("1" "2" "" "" "") (split-column/split "1a2" (re-pattern "a") 3))))
