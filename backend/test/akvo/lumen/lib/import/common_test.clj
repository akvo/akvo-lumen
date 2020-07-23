(ns akvo.lumen.lib.import.common-test
  (:require [akvo.lumen.lib.import.common :as common]
            [clojure.test :refer :all]))

(deftest extract-first-and-merge-test
  (testing "provisional adapter to store all records in one `main` table"
    (is (= {:main 1, :a 1, :b 3}
           (common/extract-first-and-merge [(with-meta {:main 1} {:ns "main"})
                                            (with-meta {:a 1} {:ns "one"})
                                            (with-meta {:a 2} {:ns "one"})
                                            (with-meta {:b 3} {:ns "two"})])))))










