(ns org.akvo.dash.transformation.engine-test
  (:import jdk.nashorn.api.scripting.NashornScriptEngine)
  (:require [clojure.test :refer :all]
            [org.akvo.dash.transformation.engine :refer :all]))


(deftest data-conversion
  (testing "Testing data conversion"
    (let [e (get-engine)]
      (is (= jdk.nashorn.api.scripting.NashornScriptEngine (class e)))
      (is (number? (to-number e "'10.5'")))
      (is (string? (to-string e 10)))
      (is (= "AKVO" (to-uppercase e "akvo")))
      (is (= "akvo" (to-lowercase e "AKVO")))
      (is (= "Akvo Foundation" (to-titlecase e "akvo foundation"))))))
