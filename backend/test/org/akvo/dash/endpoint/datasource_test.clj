(ns org.akvo.dash.endpoint.datasource-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.datasource :as datasource]))

(def handler
  (datasource/endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
