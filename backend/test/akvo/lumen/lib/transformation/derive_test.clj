(ns akvo.lumen.lib.transformation.derive-test
  (:require [akvo.lumen.lib.transformation.derive :as derive]
            [akvo.lumen.lib.transformation.engine :as engine]
            [clojure.test.check.generators :as gen]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [clojure.test.check.properties :as prop]
            [clojure.test.check.clojure-test :refer (defspec)]
            [clojure.test :refer :all]))

(defspec parse-row-object-references-double-quote-gen-test
  10000
  (prop/for-all [v  (gen/not-empty (gen/such-that #(not (str/includes? % "\"")) gen/string 100))]
                (let [expression (format "row[\"%s\"]" v)
                      r1 (derive/parse-row-object-references expression)
                      res (= (list (list expression v))
                             (derive/parse-row-object-references expression))]
                  (when-not res (log/error v expression res))
                  res)))

(defspec parse-row-object-references-simple-quote-gen-test
  10000
  (prop/for-all [v  (gen/not-empty (gen/such-that #(not (str/includes? % "'")) gen/string 100))]
                (let [expression (format "row['%s']" v)
                      r1 (derive/parse-row-object-references expression)
                      res (= (list (list expression v))
                             (derive/parse-row-object-references expression))]
                  (when-not res (log/error v expression res))
                  res)))


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

  (is (= '(["row['a-b']" "a-b"] ["row['c d']" "c d"])
         (derive/parse-row-object-references " row['a-b'] + row['c d'];")))

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
        computed (derive/compute-transformation-code (get-in t1 ["args" "code"]) c1)]

    (is (every? #(contains? computed %) ["template" "references"]))
    (is (= "c2"
           (-> (filter #(= "row['b']"
                           (get % "pattern"))
                       (get computed "references"))
               first
               (get "column-name"))))))

(deftest adapt-code-test
  (let [code_v1 "row.a_1+row.b_1"
        code_v2 "row['a_2']+row['b_2']"
        t1 {"op" "core/derive"
            "args" {"newColumnTitle" "C"
                    "newColumnType" "text"
                    "code" code_v1}
            "onError" "leave-empty"}

        older-columns [{"sort" nil
                        "type" "text"
                        "title" "a_1"
                        "hidden" false
                        "direction" nil
                        "columnName" "c1"}
                       {"sort" nil
                        "type" "text"
                        "title" "b_1"
                        "hidden" false
                        "direction" nil
                        "columnName" "c2"}]

        new-columns [{"sort" nil
                      "type" "text"
                      "title" "a_2"
                      "hidden" false
                      "direction" nil
                      "columnName" "c1"}
                     {"sort" nil
                      "type" "text"
                      "title" "b_2"
                      "hidden" false
                      "direction" nil
                      "columnName" "c2"}]
        computed (derive/compute-transformation-code (get-in t1 ["args" "code"]) older-columns)]
    (is (= code_v2 (derive/columnName>columnTitle computed new-columns)))
    (is (= (update-in t1 ["args" "code"] (constantly code_v2))
           (engine/adapt-transformation t1 older-columns new-columns)))
    ))


