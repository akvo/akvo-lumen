(ns org.akvo.dash.endpoint.visualizations-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.visualizations :as visualizations]))

(def handler
  (visualizations/visualizations-endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
