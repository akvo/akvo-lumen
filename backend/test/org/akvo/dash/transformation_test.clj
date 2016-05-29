(ns org.akvo.dash.transformation-test
  (:require [clojure.test :refer :all]
            [clojure.java.io :as io]
            [cheshire.core :as json]
            [org.akvo.dash.transformation :as tf]))

(def ops (vec (json/parse-string (slurp (io/resource "ops.json")))))
(def invalid-op (-> (take 3 ops)
                    vec
                    (update-in [1 "args"] dissoc "parseFormat")))

(deftest op-validation
  (testing "op validation"
    (is (= true (:valid? (tf/valid? ops))))
    (let [result (tf/valid? invalid-op)]
      (is (= false (:valid? result)))
      (is (= (format "Invalid operation %s" (second invalid-op)) (:message result))))))
