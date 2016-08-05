(ns org.akvo.lumen.endpoint.visualisation-test
  (:require [clojure.test :refer :all]
            [org.akvo.lumen.endpoint.visualisation :as visualisation]))

(def handler
  (visualisation/endpoint {}))

#_(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
