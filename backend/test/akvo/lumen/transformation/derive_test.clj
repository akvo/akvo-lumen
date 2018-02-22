(ns akvo.lumen.transformation.derive-test
  (:require [akvo.lumen.transformation.derive :as derive]
            [clojure.test :refer :all]))


(deftest valid-javascript
  (testing "Return string"
    (is (derive/valid? "\"a\"")))

  (testing "Valid expression"
    (is (derive/valid? "row['col-1'] == 'foo' ? 'bar' : 'baz'")))

  (testing "Calling function"
    (is (not (derive/valid? "var f = function (x) {x};"))))

  (testing "Calling function"
    (is (not (derive/valid? "var f = (x) => x;"))))

  (testing "Get date"
    (is (derive/valid? "Date().toString();")))

  )
