(ns org.akvo.dash.transformation-test
  (:require [clojure.test :refer :all]
            [clojure.java.io :as io]
            [cheshire.core :as json]
            [org.akvo.dash.transformation :as tf]))

(def ops (vec (json/parse-string (slurp (io/resource "ops.json")))))

(deftest op-validation
  (testing "op validation"
    (is (= true (:valid? (tf/valid? ops))))))
