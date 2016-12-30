(ns akvo.lumen.endpoint.library-test
  (:require [clojure.test :refer :all]
            [akvo.lumen.endpoint.library :as library]))

(def handler
  (library/endpoint {}))

#_(deftest a-test
  (testing "FIXME, I fail."
    (is (= 1 1))))
