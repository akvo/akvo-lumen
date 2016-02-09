(ns org.akvo.dash.endpoint.visualisation-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.visualisation :as visualisation]))

(def handler
  (visualisation/endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
