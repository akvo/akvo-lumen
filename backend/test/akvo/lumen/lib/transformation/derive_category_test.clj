(ns akvo.lumen.lib.transformation.derive-category-test
  (:require [akvo.lumen.lib.transformation.derive-category :as derive-category]
            [clojure.tools.logging :as log]
            [clojure.test.check.clojure-test :refer (defspec)]
            [clojure.test :refer :all]))

(deftest find-category-test
  (testing "mapping number type"
    (let [uncategorized-val "no-cat"
          cat-one           "one"
          cat-two           "two"
          mappings          [[[">=" 0] ["<=" 1] cat-one]
                             [["=" 2] nil cat-two]]]
      (is (= cat-one (derive-category/find-number-cat mappings 1 uncategorized-val)))
      (is (= cat-two (derive-category/find-number-cat mappings 2 uncategorized-val)))
      (is (= uncategorized-val (derive-category/find-number-cat mappings 3 uncategorized-val))))))

