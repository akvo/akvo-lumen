(ns akvo.lumen.component.auth0-test
  {:functional false}
  (:require
   [akvo.lumen.component.auth0 :as auth0]
   [clojure.test :refer :all]))

(deftest auth0-test
  (testing "path>role"
    (is (= "akvo:lumen:t1"
           (auth0/path->role "/akvo/lumen/t1")))))

