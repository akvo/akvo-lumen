(ns akvo.lumen.endpoint.library-test
  (:require [akvo.lumen.endpoint.library :as library]))

(def handler
  (library/endpoint {}))

#_(deftest a-test
  (testing "FIXME, I fail."
    (is (= 1 1))))
