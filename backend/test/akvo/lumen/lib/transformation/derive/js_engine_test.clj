(ns akvo.lumen.lib.transformation.derive.js-engine-test
  (:require
   [akvo.lumen.lib.transformation.derive.js-engine :as js-engine]
   [clojure.test :refer [deftest is]]))

(deftest javascript-logic
  (is (not (js-engine/eval* "NaN === NaN;"))))
