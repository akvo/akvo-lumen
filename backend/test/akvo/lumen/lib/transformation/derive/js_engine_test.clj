(ns akvo.lumen.lib.transformation.derive.js-engine-test
  (:require
   [akvo.lumen.lib.transformation.derive :as derive]
   [akvo.lumen.lib.transformation.derive.js-engine :as js-engine]
   [clojure.edn :as edn]
   [clojure.string :as string]
   [clojure.test :refer [deftest is]]
   [clojure.walk :as walk]))


(deftest javascript-logic
  (is (= (js-engine/eval* "1 + 1") 2))
  (is (= (js-engine/eval* "'akvo'.toUpperCase();") "AKVO"))
  (is (not (js-engine/eval* "NaN === NaN;"))))

(deftest row-transform-fn-rqg
  (let [columns [{"groupId" nil,
                  "key" true,
                  "groupName" nil,
                  "sort" nil,
                  "direction" nil,
                  "metadata" nil,
                  "title" "Identifier",
                  "type" "text",
                  "hidden" false,
                  "columnName" "identifier"}
                 {"groupId" "567919211",
                  "groupName" "Repeating Biodata",
                  "sort" nil,
                  "direction" nil,
                  "metadata"
                  {"columns"
                   [{"id" "c587209169",
                     "type" "text",
                     "title" "Name",
                     "groupId" nil,
                     "metadata" nil,
                     "groupName" nil}
                    {"id" "c565649136",
                     "type" "number",
                     "title" "Age repeated",
                     "groupId" nil,
                     "metadata" nil,
                     "groupName" nil}
                    {"id" "c569709126",
                     "type" "number",
                     "title" "ID number",
                     "groupId" nil,
                     "metadata" nil,
                     "groupName" nil}]},
                  "title" "Repeating Biodata",
                  "type" "rqg",
                  "hidden" false,
                  "columnName" "c567919211"}]
        adapter (comp (js-engine/rqg columns)
                      (js-engine/column-name->column-title columns))
        row {:identifier "b9vn-060u-gwp3"
             :c567919211 "[{\"Name\": \"once\", \"ID number\": 65894632, \"Age repeated\": 21.0},
                           {\"Name\": \"twice\", \"ID number\": 66999888452, \"Age repeated\": 23.0},
                           {\"Name\": \"three timea\", \"ID number\": 67302878563, \"Age repeated\": 21.0}]"}

        columns-groups (derive/columns-groups (walk/keywordize-keys columns))
        row-extended (derive/extend-row row adapter columns-groups)
        row-fn (js-engine/row-transform-fn {:adapter adapter
                                            :code "row[\"Repeating Biodata\"].filter(a => a.Name === \"once\")"})]
    (is (= (row-fn row-extended)
           {"0" {"Name" "once", "ID number" 65894632, "Age repeated" 21}}))))


(deftest checking-valid-code
  (is (true? (js-engine/evaluable? "true")))
  (is (true? (js-engine/evaluable? "1+2")))
  (is (true? (js-engine/evaluable? "row[\"age\"].reduce((a,b) => (a+b))")))
  (is (true? (js-engine/evaluable? "row[\"group\"][\"column\"].filter(a => a.prop === 1)")))
  (is (false? (js-engine/evaluable? "(function(){while(true);})()")))
  (is (false? (js-engine/evaluable? "while(true);")))
  (is (false? (js-engine/evaluable? "for(;;);")))
  (is (false? (js-engine/evaluable? "(function(){for(;;);})()"))))
