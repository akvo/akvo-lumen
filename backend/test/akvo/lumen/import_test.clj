(ns akvo.lumen.import-test
  (:require [akvo.lumen.specs.import :as i]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.test :refer [deftest testing is]]))

(deftest ^:unit check-generator
  (testing "sample-imported-dataset result"
    (let [{:keys [rows columns]} (i/sample-imported-dataset [:text :number :text :date] 1)]
      (is (= 4 (count columns)))
      (is (= 1 (count rows)))))
  (testing "sample-imported-dataset with generators "
    (let [{:keys [rows columns]} (i/sample-imported-dataset [[:text #(s/gen #{"2017-12-03T10:15:30.00Z"  })]
                                                             [:number #(s/gen #{1.0})]
                                                             :text :date] 2)]
      (is (= '("2017-12-03T10:15:30.00Z" "2017-12-03T10:15:30.00Z")  (map (comp :value first) rows)))
      (is (= '(1.0 1.0)  (map (comp :value second) rows))))))
