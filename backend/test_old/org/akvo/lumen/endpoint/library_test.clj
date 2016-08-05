(ns org.akvo.lumen.endpoint.library-test
  (:require [clojure.test :refer :all]
            [shrubbery.core :as shrub]
            [org.akvo.lumen.endpoint.library :as library]))

(def handler
  (library/library-endpoint {}))

(deftest a-test
  (testing "FIXME, I fail."
    (is (= 0 1))))
