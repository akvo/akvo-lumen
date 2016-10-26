(ns org.akvo.lumen.import.common-test
  (:require [clojure.java.io :as io]
            [clojure.test :refer :all]
            [org.akvo.lumen.import.common :refer [unix-line-ending-input-stream]]))


(deftest test-unix-line-endings
  (testing "Ensure imported files have Unix line endings"))
