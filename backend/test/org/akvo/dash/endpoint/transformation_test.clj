(ns org.akvo.dash.endpoint.transformation-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.transformation :as transformation]))

(def handler
  (transformation/endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 1 1))))
