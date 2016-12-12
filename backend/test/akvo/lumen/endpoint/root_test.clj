(ns akvo.lumen.endpoint.root-test
  (:require [clojure.test :refer :all]
            [akvo.lumen.endpoint.root :as root]))

(def handler
  (root/endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 1 1))))
