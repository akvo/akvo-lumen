(ns org.akvo.dash.endpoint.assets-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.assets :as assets]))

(def handler
  (assets/assets-endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
