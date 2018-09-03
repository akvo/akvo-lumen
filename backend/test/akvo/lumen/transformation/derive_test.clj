(ns akvo.lumen.transformation.derive-test
  (:require [akvo.lumen.transformation.derive :as derive]
            [akvo.lumen.transformation.engine :as t.engine]
            [clojure.test :refer :all]))


(deftest parse-row-object-references
  (is (= '(["row.a" "a"])
         (derive/parse-row-object-references "row.a")))

  (is (= '(["row['a']" "a"])
         (derive/parse-row-object-references "row['a'];")))

  (is (= '(["row[\"a\"]" "a"])
         (derive/parse-row-object-references "row[\"a\"].replace(\"a\", \"b\")")))

  (is (= '(["row.b" "b"] ["row['c']" "c"])
         (derive/parse-row-object-references " row.b + row['c'];")))

  (is (= '(["row['a b']" "a b"] ["row['c']" "c"])
         (derive/parse-row-object-references " row['a b'] + row['c'];")))

  (is (= '(["row['foo']" "foo"])
         (derive/parse-row-object-references "row['foo'].toUpperCase()")))

  (is (= '(["row['Derived 4']" "Derived 4"])
         (derive/parse-row-object-references "row['Derived 4'].toLowerCase()")))

  (is (= '(["new Date()" "new Date()"])
         (derive/parse-row-object-references "new Date()")))

  (is (= '(["row['No.4']" "No.4"])
         (derive/parse-row-object-references  "row['No.4']")))

  (is (= '(["row['A']" "A"] ["row[\"B\"]" "B"])
         (derive/parse-row-object-references  "row['A'] + row[\"B\"]")))

  (is (= '(["row['%']" "%"])
         (derive/parse-row-object-references "row['%']")))

  (is (= '(["row['&']" "&"])
         (derive/parse-row-object-references "row['&']")))

  (is (= '(["row['ÅÄÖ']" "ÅÄÖ"])
         (derive/parse-row-object-references "row['ÅÄÖ']")))

  (is (= '(["row['e`']" "e`"])
         (derive/parse-row-object-references "row['e`']"))))


(deftest computed
  (let [t1 {"op" "core/derive"
            "args" {"newColumnTitle" "C"
                    "newColumnType" "text"
                    "code" "row['b'].replace('b', 'c');"}
            "onError" "leave-empty"}
        c1 [{"sort" nil
             "type" "text"
             "title" "A"
             "hidden" false
             "direction" nil
             "columnName" "c1"}
            {"sort" nil
             "type" "text"
             "title" "b"
             "hidden" false
             "direction" nil
             "columnName" "c2"}]
        computed (get (t.engine/pre-hook t1 c1) "computed")
        _ (prn "@computed/test")
        _ (prn computed)
        ]

    (is (every? #(contains? computed %) ["template" "references"]))
    (is (= "c2"
           (-> (filter #(= "row['b']"
                           (get % "pattern"))
                       (get computed "references"))
               first
               (get "column-name"))))))
