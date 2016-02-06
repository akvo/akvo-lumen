(ns org.akvo.dash.endpoint.datasets-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.datasets :as datasets]))

(def handler
  (datasets/endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
