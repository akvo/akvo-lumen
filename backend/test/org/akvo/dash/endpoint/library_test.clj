(ns org.akvo.dash.endpoint.library-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.endpoint.library :as library]))

(def handler
  (library/endpoint {}))

#_(deftest a-test
  (testing "FIXME, I fail."
    (is (= 1 1))))
