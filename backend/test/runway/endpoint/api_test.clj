(ns runway.endpoint.api-test
  (:require [clojure.test :refer :all]
            [runway.endpoint.api :as api]))

(def handler
  (api/api-endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
