(ns org.akvo.dash.endpoint.activity-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.activity :as activity]))

(def handler
  (activity/endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
