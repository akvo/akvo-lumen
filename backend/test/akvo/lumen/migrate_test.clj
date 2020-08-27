(ns akvo.lumen.migrate-test
  (:require [clojure.test :refer :all]
            [akvo.lumen.migrate :as migrate]))

(deftest ^:unit migration-strategy
  (testing "happy path migrations"
    (are [applied-already all-migrations expected-result]
        (= (migrate/ignore-future-migrations applied-already all-migrations) expected-result)

      [:a] [:a] []
      [] [] []
      [:a :b] [:a :b] []
      [:a] [:a :b] [[:migrate :b]]
      [:a] [:a :b :c] [[:migrate :b] [:migrate :c]]
      [] [:a :b] [[:migrate :a] [:migrate :b]]))
  (testing "Future migrations are ok"
    (are [applied-already all-migrations expected-result]
        (= (migrate/ignore-future-migrations applied-already all-migrations) expected-result)
      [:a :b :c] [:a] []))
  (testing "incompatible changes"
    (are [applied-already all-migrations] (thrown? Exception (migrate/ignore-future-migrations applied-already all-migrations))
      [:a] [:b]
      [:a :b :c] [:a :d :c]
      [:a :b :c] [:a :c :b])))
