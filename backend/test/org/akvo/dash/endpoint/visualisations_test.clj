(ns org.akvo.dash.endpoint.visualisations-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.visualisations :as visualisations]))

(def handler
  (visualisations/visualisations-endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
