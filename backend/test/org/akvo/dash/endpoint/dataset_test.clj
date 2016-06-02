(ns org.akvo.dash.endpoint.dataset-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.dataset :as dataset]
            [ring.mock.request :as mock]))

(def handler
  (dataset/endpoint {}))

(deftest handler-test
  (testing "logic"
    (is (= 1 1))))
