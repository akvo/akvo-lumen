(ns org.akvo.dash.endpoint.root-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.root :as root]))

(def handler
  (root/endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 1 1))))
