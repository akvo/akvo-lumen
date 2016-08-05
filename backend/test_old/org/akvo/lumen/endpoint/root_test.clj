(ns org.akvo.lumen.endpoint.root-test
  (:require [clojure.test :refer :all]
            [shrubbery.core :as shrub]
            [org.akvo.lumen.endpoint.root :as root]))

(def handler
  (root/root-endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
