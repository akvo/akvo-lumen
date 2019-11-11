(ns akvo.lumen.lib.transformation.derive.js-engine-test
  (:require
   [akvo.lumen.lib.transformation.derive.js-engine :as js-engine]
   [clojure.edn :as edn]
   [clojure.string :as string]
   [clojure.test :refer [deftest is]]))

(deftest java-version-11
  (is (>= (-> (System/getProperty "java.version")
              (string/split #"\.")
              first
              edn/read-string)
          11)))

(deftest javascript-logic
  (is (= (js-engine/eval* "1 + 1") 2))
  (is (= (js-engine/eval* "'akvo'.toUpperCase();") "AKVO"))
  (is (not (js-engine/eval* "NaN === NaN;"))))
