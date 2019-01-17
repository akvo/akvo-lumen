(ns akvo.lumen.endpoint.root-test
  (:require [akvo.lumen.endpoint.root :as root]
            [clojure.test :refer :all]))

(def handler
  (root/routes {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 1 1))))
