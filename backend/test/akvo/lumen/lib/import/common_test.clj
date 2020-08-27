(ns akvo.lumen.lib.import.common-test
  (:require [akvo.lumen.lib.import.common :as common]
            [clojure.test :refer :all]))

(deftest ^:unit extract-first-and-merge-test
  (testing "extract every first ns-responses into one `main` response"
    (is (= {:main 1, :a 1, :b 3}
           (common/extract-first-and-merge [(with-meta {:main 1} {:ns "main"})
                                            (with-meta {:a 1} {:ns "one"})
                                            (with-meta {:a 2} {:ns "one"})
                                            (with-meta {:b 3} {:ns "two"})])))))
