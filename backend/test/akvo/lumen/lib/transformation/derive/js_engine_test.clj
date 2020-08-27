(ns akvo.lumen.lib.transformation.derive.js-engine-test
  (:require
   [akvo.lumen.lib.transformation.derive.js-engine :as js-engine]
   [clojure.edn :as edn]
   [clojure.string :as string]
   [clojure.test :refer [deftest is]]))


(deftest ^:unit javascript-logic
  (is (= (js-engine/eval* "1 + 1") 2))
  (is (= (js-engine/eval* "'akvo'.toUpperCase();") "AKVO"))
  (is (not (js-engine/eval* "NaN === NaN;"))))

(deftest ^:unit checking-valid-code
  (is (true? (js-engine/evaluable? "true")))
  (is (true? (js-engine/evaluable? "1+2")))
  (is (true? (js-engine/evaluable? "row[\"age\"].reduce((a,b) => (a+b))")))
  (is (true? (js-engine/evaluable? "row[\"group\"][\"column\"].filter(a => a.prop === 1)")))
  (is (false? (js-engine/evaluable? "(function(){while(true);})()")))
  (is (false? (js-engine/evaluable? "while(true);")))
  (is (false? (js-engine/evaluable? "for(;;);")))
  (is (false? (js-engine/evaluable? "(function(){for(;;);})()"))))
