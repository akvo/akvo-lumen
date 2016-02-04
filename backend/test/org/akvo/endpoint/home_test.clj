(ns org.akvo.endpoint.home-test
  (:require [clojure.test :refer :all]
            [org.akvo.endpoint.home :as home]))

(def handler
  (home/home-endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
