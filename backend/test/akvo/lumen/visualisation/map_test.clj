(ns akvo.lumen.visualisation.map_test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [;; *tenant-conn*
                                         tenant-conn-fixture
                                         system-fixture
                                         ;; *error-tracker*
                                         error-tracker-fixture]]
            [akvo.lumen.test-utils :as tu]
            [clojure.test :refer [deftest testing is use-fixtures]]))

(use-fixtures :once system-fixture tenant-conn-fixture error-tracker-fixture tu/spec-instrument)

(deftest ^:functional foo
  (testing "bar"
    (is (= 1 1))))
