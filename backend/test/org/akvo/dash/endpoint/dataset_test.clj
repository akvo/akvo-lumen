(ns org.akvo.dash.endpoint.dataset-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.dataset :as dataset]))

(def handler
  (dataset/endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
