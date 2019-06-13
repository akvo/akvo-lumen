(ns akvo.lumen.lib.transformation-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         system-fixture
                                         *error-tracker*
                                         error-tracker-fixture
                                         summarise-transformation-logs-fixture
                                         *caddisfly*
                                         caddisfly-fixture]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.multiple-column :as multiple-column]
            [akvo.lumen.lib.transformation :as transformation]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.lib.transformation.derive-category :as derive-category]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.specs.import :as import.s]
            [akvo.lumen.specs.import.column :as import.column.s]
            [akvo.lumen.specs.import.values :as import.values.s]
            [akvo.lumen.specs.transformation :as transformation.s]
            [akvo.lumen.test-utils :refer [import-file at-least-one-true retry-job-execution] :as tu]
            [akvo.lumen.util :refer [conform squuid]]
            [cheshire.core :as json]
            [clj-time.coerce :as tcc]
            [clj-time.core :as tc]
            [clj-time.format :as timef]
            [clojure.java.io :as io]
            [clojure.set :as set]
            [clojure.spec.alpha :as s]
            [clojure.string :as string]
            [clojure.test :refer :all]
            [clojure.tools.logging :as log]
            [clojure.walk :refer (stringify-keys keywordize-keys)]
            [hugsql.core :as hugsql])
  (:import [akvo.lumen.postgres Geoshape Geopoint]))

(alias 'import.column.text.s                    'akvo.lumen.specs.import.column.text)
(alias 'import.column.number.s                    'akvo.lumen.specs.import.column.number)
(alias 'import.column.geoshape.s                'akvo.lumen.specs.import.column.geoshape)
(alias 'import.column.multiple.s                'akvo.lumen.specs.import.column.multiple)
(alias 'import.column.multiple.caddisfly.s      'akvo.lumen.specs.import.column.multiple.caddisfly)
(alias 'import.column.multiple.geo-shape-features.s  'akvo.lumen.specs.import.column.multiple.geo-shape-features)
(alias 'transformation.engine.s                 'akvo.lumen.specs.transformation.engine)
(alias 'transformation.combine.s                'akvo.lumen.specs.transformation.combine)
(alias 'transformation.filter-column.s          'akvo.lumen.specs.transformation.filter-column)
(alias 'transformation.split-column.s           'akvo.lumen.specs.transformation.split-column)
(alias 'transformation.derive.s                 'akvo.lumen.specs.transformation.derive)
(alias 'transformation.change-datatype.s        'akvo.lumen.specs.transformation.change-datatype)
(alias 'transformation.sort-column.s            'akvo.lumen.specs.transformation.sort-column)
(alias 'transformation.remove-sort.s            'akvo.lumen.specs.transformation.remove-sort)
(alias 'transformation.generate-geopoints.s     'akvo.lumen.specs.transformation.generate-geopoints)
(alias 'transformation.rename-column.s          'akvo.lumen.specs.transformation.rename-column)
(alias 'transformation.merge-datasets.source.s  'akvo.lumen.specs.transformation.merge-datasets.source)
(alias 'transformation.merge-datasets.target.s  'akvo.lumen.specs.transformation.merge-datasets.target)
(alias 'transformation.merge-datasets.s         'akvo.lumen.specs.transformation.merge-datasets)
(alias 'transformation.derive-category.derivation.s 'akvo.lumen.specs.transformation.derive-category.derivation)
(alias 'transformation.derive-category.target.s 'akvo.lumen.specs.transformation.derive-category.target)
(alias 'transformation.derive-category.source.s 'akvo.lumen.specs.transformation.derive-category.source)
(alias 'transformation.derive-category.s 'akvo.lumen.specs.transformation.derive-category)
(alias 'transformation.reverse-geocode.source.s 'akvo.lumen.specs.transformation.reverse-geocode.source)
(alias 'transformation.reverse-geocode.target.s 'akvo.lumen.specs.transformation.reverse-geocode.target)
(alias 'transformation.reverse-geocode.s        'akvo.lumen.specs.transformation.reverse-geocode)
(alias 'db.dataset-version.s                    'akvo.lumen.specs.db.dataset-version)
(alias 'db.dataset-version.column.s             'akvo.lumen.specs.db.dataset-version.column)

(use-fixtures :once tu/spec-instrument caddisfly-fixture system-fixture tenant-conn-fixture error-tracker-fixture summarise-transformation-logs-fixture)

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation_test.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")

(defn async-tx-apply [{:keys [tenant-conn] :as deps} dataset-id command]
  (let [[tag {:keys [jobExecutionId datasetId]} :as res] (transformation/apply deps dataset-id command)
        [job _] (retry-job-execution tenant-conn jobExecutionId true)]
    (conj res (:status job))))

(defn latest-data [dataset-id]
  (let [table-name (:table-name
                    (latest-dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id}))]
    (get-data *tenant-conn* {:table-name table-name})))

(def ops (vec (json/parse-string (slurp (io/resource "ops.json")))))

(def invalid-op (-> (take 3 ops)
                    vec
                    (update-in [1 "args"] dissoc "parseFormat")))

(deftest op-validation
  (testing "op validation"
    (doseq [op ops]
      (is (engine/valid? op) (str op)))
    (let [result (transformation/validate {:type :transformation :transformation (second invalid-op)})]
      (is (= false (:valid? result)))
      (is (= (format "Invalid transformation %s" (second invalid-op)) (:message result))))))

(defn gen-transformation
  "due some specs issues we need to generate merge specs step by step
  issues related to s/merge or generating false/nil values"
  [t-type  gens & kvs]
  (let [t-type (keyword t-type)
        op-name (str (namespace t-type) "/" (name t-type))
        gens (when gens
               (reduce-kv (fn [c k v]
                            (if (fn? v)
                              (assoc c k v)
                              (assoc c k #(s/gen #{v})))
                            ) {} gens))
        s (first (lumen.s/sample-with-gen (transformation.s/op-spec {:op op-name}) gens 1))
        args (first (lumen.s/sample-with-gen (keyword (str "akvo.lumen.specs.transformation." (name t-type) "/args")) gens 1))
        args (if (and kvs (not-empty kvs) (even? (count kvs)))
               (reduce #((if (vector? (first %2))  assoc-in assoc) % (first %2) (last %2)) args (partition 2 kvs))
               args)
        
]
    (conform ::transformation.engine.s/op-spec (assoc s :op op-name :args args))

    (tu/clj>json>clj (assoc s :op op-name :args args))))

(deftest ^:functional test-transformations
  (testing "Transformation application"
    (is (= [::lib/bad-request {:message "Dataset not found"} nil]
           (async-tx-apply {:tenant-conn *tenant-conn*} "Not-valid-id" []))))
  (testing "Valid log"
    (let [dataset-id (import-file *tenant-conn* *error-tracker* {:name "Transformation Test"
                                                                 :has-column-headers? true
                                                                 :file "transformation_test.csv"})
          [tag _] (last (for [transformation ops]
                          (async-tx-apply {:tenant-conn *tenant-conn*} dataset-id {:type :transformation
                                                                             :transformation transformation})))]
      (is (= ::lib/ok tag)))))

(deftest ^:functional test-import-and-transform
  (testing "Import CSV and transform"
    (let [t-log      [(gen-transformation "core/trim" {::db.dataset-version.column.s/columnName "c5"
                                                      ::transformation.engine.s/onError        "fail"})
                      (gen-transformation "core/change-datatype" {::db.dataset-version.column.s/columnName        "c5"
                                                                 ::transformation.change-datatype.s/defaultValue 0
                                                                 ::transformation.change-datatype.s/newType      "number"
                                                                 ::transformation.engine.s/onError               "default-value"})
                      (gen-transformation "core/filter-column" {::db.dataset-version.column.s/columnName    "c4"
                                                               ::transformation.filter-column.s/expression {"contains" "broken"}
                                                               ::transformation.engine.s/onError           "fail"})]
          dataset-id (import-file *tenant-conn* *error-tracker* {:name                "GDP Test"
                                                                 :has-column-headers? false
                                                                 :file                "GDP.csv"})]
      (let [[tag {:keys [datasetId]}] (last (for [transformation t-log]
                                              (async-tx-apply {:tenant-conn *tenant-conn*}
                                                                    dataset-id
                                                                    {:type           :transformation
                                                                     :transformation transformation})))]

        (is (= ::lib/ok tag))

        (let [table-name (:table-name (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                            {:dataset-id datasetId}))]
          (is (zero? (:c5 (get-val-from-table *tenant-conn*
                                              {:rnum        196
                                               :column-name "c5"
                                               :table-name  table-name}))))
          (is (= "[Broken]" (:c4 (get-val-from-table *tenant-conn* {:rnum        196
                                                                    :column-name "c4"
                                                                    :table-name  table-name}))))
          (is (= 1 (:total (get-row-count *tenant-conn* {:table-name table-name})))))))))

(deftest ^:functional test-undo
  (let [dataset-id (import-file *tenant-conn* *error-tracker* {:dataset-name "GDP Undo Test"
                                                               :file "GDP.csv"})
        {previous-table-name :table-name} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                {:dataset-id dataset-id})
        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} dataset-id)]
    (is (= ::lib/ok (first (apply-transformation {:type :undo}))))
    (let [[tag _] (do (apply-transformation {:type :transformation
                                             :transformation (gen-transformation "core/to-lowercase"
                                                                                 {::db.dataset-version.column.s/columnName "c1"
                                                                                  ::transformation.engine.s/onError "fail"})})
                      (apply-transformation {:type :transformation
                                             :transformation (gen-transformation "core/change-datatype"
                                                                                 {::db.dataset-version.column.s/columnName "c5"
                                                                                  ::transformation.engine.s/onError "default-value"
                                                                                  ::transformation.change-datatype.s/newType "number"
                                                                                  ::transformation.change-datatype.s/defaultValue 0})})
                      (apply-transformation {:type :undo}))]
      (is (= ::lib/ok tag))
      (is (not (:exists (table-exists *tenant-conn* {:table-name previous-table-name}))))
      (is (= (:columns (dataset-version-by-dataset-id *tenant-conn*
                                                      {:dataset-id dataset-id :version 2}))
             (:columns (latest-dataset-version-by-dataset-id *tenant-conn*
                                                             {:dataset-id dataset-id}))))
      (let [table-name (:table-name
                        (latest-dataset-version-by-dataset-id *tenant-conn*
                                                              {:dataset-id dataset-id}))]
        (is (= "usa"
               (:c1 (get-val-from-table *tenant-conn*
                                        {:rnum 1
                                         :column-name "c1"
                                         :table-name table-name})))))
      (apply-transformation {:type :undo})
      (let [table-name (:table-name
                        (latest-dataset-version-by-dataset-id *tenant-conn*
                                                              {:dataset-id dataset-id}))]
        (is (= "USA"
               (:c1 (get-val-from-table *tenant-conn*
                                        {:rnum 1
                                         :column-name "c1"
                                         :table-name table-name}))))))))

(deftest ^:functional combine-transformation-test
  (let [dataset-id (import-file *tenant-conn* *error-tracker* {:has-column-headers? true
                                                               :file "name.csv"})
        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} dataset-id)
        [tag _] (apply-transformation {:type :transformation
                                       :transformation (gen-transformation "core/combine"
                                                                           {::transformation.combine.s/columnNames ["c1" "c2"]
                                                                            ::transformation.engine.s/onError "fail"
                                                                            ::transformation.combine.s/newColumnTitle "full name"
                                                                            ::transformation.combine.s/separator " "})})]
    (is (= ::lib/ok tag))
    (let [table-name (:table-name
                      (latest-dataset-version-by-dataset-id *tenant-conn*
                                                            {:dataset-id dataset-id}))]
      (is (= "bob hope"
             (:d1 (get-val-from-table *tenant-conn*
                                      {:rnum 1
                                       :column-name "d1"
                                       :table-name table-name})))))

    ;;https://github.com/akvo/akvo-lumen/issues/1517
    (testing "Combining columns where one of the columns has empty values"
      (let [[tag _] (apply-transformation {:type :transformation
                                           :transformation
                                         (gen-transformation "core/combine"
                                                             {:akvo.lumen.specs.transformation.combine/columnNames ["c2" "c3"]                                                                          ::transformation.engine.s/onError "fail"
                                                              :akvo.lumen.specs.transformation.combine/newColumnTitle "issue1517"
                                                              :akvo.lumen.specs.transformation.combine/separator " "})})]
        (is (= ::lib/ok tag))
        (let [table-name (:table-name
                          (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                {:dataset-id dataset-id}))]
          (is (= "hope "
                 (:d2 (get-val-from-table *tenant-conn*
                                          {:rnum 1
                                           :column-name "d2"
                                           :table-name table-name})))))))))

(deftest ^:functional date-parsing-test
  (let [date-transformation (fn[column-name format*]
                              {:type           :transformation
                               :transformation
                               (gen-transformation
                                "core/change-datatype" {:akvo.lumen.specs.db.dataset-version.column/columnName column-name
                                                       :akvo.lumen.specs.transformation.change-datatype/defaultValue 0
                                                       :akvo.lumen.specs.transformation.change-datatype/newType "date"
                                                       ::transformation.engine.s/onError "fail"}
                                :parseFormat format*)})
        data                (import.s/sample-imported-dataset [:text
                                                          [:text {::import.column.text.s/value (fn [] (import.column.s/date-format-gen
                                                                                         (fn [[y _ _ :as date]]
                                                                                           (str y))))
                                                                  ::import.values.s/key (fn [] import.column.s/false-gen)}]
                                                          [:text {::import.column.text.s/value (fn [] (import.column.s/date-format-gen
                                                                                         (fn [[y m d :as date]]
                                                                                           (str d "/" m "/" y))))
                                                                  ::import.values.s/key (fn [] import.column.s/false-gen)}]
                                                          [:text {::import.column.text.s/value (fn [] (import.column.s/date-format-gen
                                                                                         (fn [date]
                                                                                           (string/join "-" date))))
                                                                  ::import.values.s/key (fn [] import.column.s/false-gen)}]]
                                                         10)
        years               (map (comp :value second) (:rows data))
        years-slash         (map (comp (partial timef/parse (timef/formatter "dd/MM/yyyy")) :value first next next) (:rows data))
        years-hiphen        (map (comp (partial timef/parse (timef/formatter "yyyy-MM-dd")) :value first next next next) (:rows data))
        dataset-id          (import-file *tenant-conn* *error-tracker* 
                                         {:dataset-name "date-parsing-test-bis"
                                          :kind         "clj"
                                          :data         data})

        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} dataset-id)]
    (let [[tag {:keys [datasetId]}] (do (apply-transformation (date-transformation "c2" "YYYY"))
                                        (apply-transformation (date-transformation "c3" "DD/MM/YYYY"))
                                        (apply-transformation (date-transformation "c4" "YYYY-MM-DD")))]
      (is (= ::lib/ok tag))
      (let [table-name (:table-name (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                          {:dataset-id datasetId}))
            table-data (get-data *tenant-conn* {:table-name table-name})]
        (is (= years (map (comp str tc/year tcc/from-long :c2) table-data)))
        (is (= years-slash (map (comp tcc/from-long :c3) table-data)))
        (is (= years-hiphen (map (comp tcc/from-long :c4) table-data)))))))

(deftest ^:functional derived-column-test
  (let [change-datatype-transformation (fn [column-name]
                                         {:type :transformation
                                          :transformation
                                          (-> (gen-transformation
                                               "core/change-datatype" {::db.dataset-version.column.s/columnName "column-name"
                                                                      ::transformation.change-datatype.s/newType "number"
                                                                      ::transformation.engine.s/onError "default-value"})
                                              (assoc-in ["args" "defaultValue"] nil))})
        dataset-id (import-file *tenant-conn* *error-tracker* {:has-column-headers? true
                                                               :file "derived-column.csv"})
        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} dataset-id)]
    (do (apply-transformation (change-datatype-transformation "c2"))
        (apply-transformation (change-datatype-transformation "c3")))

    (testing "Import and initial transforms"
      (is (= (latest-data dataset-id)
             [{:rnum 1 :c1 "a" :c2 1.0 :c3 2.0}
              {:rnum 2 :c1 "b" :c2 3.0 :c3 nil}
              {:rnum 3 :c1 nil :c2 4.0 :c3 5.0}])))

    (testing "Basic text transform"
      (apply-transformation {:type :transformation
                             :transformation
                             (gen-transformation "core/derive"
                                                 {::transformation.derive.s/newColumnTitle "Derived 1"
                                                  ::transformation.derive.s/code "row['foo'].toUpperCase()"
                                                  ::transformation.derive.s/newColumnType "text"
                                                  ::transformation.engine.s/onError "leave-empty"})})
      (is (= ["A" "B" nil] (map :d1 (latest-data dataset-id)))))

    (testing "Basic text transform with drop row on error"
      (apply-transformation {:type :transformation
                             :transformation
                             (gen-transformation "core/derive"
                                                 {::transformation.derive.s/newColumnTitle "Derived 3"
                                                  ::transformation.derive.s/code "row['foo'].replace('a', 'b')"
                                                  ::transformation.derive.s/newColumnType "text"
                                                  ::transformation.engine.s/onError "delete-row"})})
      (is (= ["b" "b"] (map :d2 (latest-data dataset-id))))
      ;; Undo this so we have all the rows in the remaining tests
      (apply-transformation {:type :undo}))

    (testing "Basic text transform with abort"
      (apply-transformation {:type :transformation
                             :transformation
                             (gen-transformation "core/derive"
                                                 {::transformation.derive.s/newColumnTitle "Derived 2"
                                                  ::transformation.derive.s/code "row['foo'].length"
                                                  ::transformation.derive.s/newColumnType "number"
                                                  ::transformation.engine.s/onError "fail"})})
      (is (-> (latest-data dataset-id)
              first
              keys
              set
              (contains? :d2)
              not)))

    (testing "Nested string transform"
      (apply-transformation {:type :transformation
                             :transformation
                             (gen-transformation "core/derive"
                                                 {::transformation.derive.s/newColumnTitle "Derived 4"
                                                  ::transformation.derive.s/code "row['foo'].toUpperCase()"
                                                  ::transformation.derive.s/newColumnType "text"
                                                  ::transformation.engine.s/onError "leave-empty"})})
      (is (= ["A" "B" nil] (map :d2 (latest-data dataset-id))))

      (apply-transformation {:type :transformation
                             :transformation
                             (gen-transformation "core/derive"
                                                 {::transformation.derive.s/newColumnTitle "Derived 5"
                                                  ::transformation.derive.s/code "row['Derived 4'].toLowerCase()"
                                                  ::transformation.derive.s/newColumnType "text"
                                                  ::transformation.engine.s/onError "leave-empty"})})
      (is (= ["a" "b" nil] (map :d3 (latest-data dataset-id)))))

    (testing "Date transform"
      (let [[tag _] (apply-transformation {:type :transformation
                                           :transformation
                                           (gen-transformation "core/derive"
                                                               {::transformation.derive.s/newColumnTitle "Derived 5"
                                                                ::transformation.derive.s/code "new Date()"
                                                                ::transformation.derive.s/newColumnType "date"
                                                                ::transformation.engine.s/onError "fail"})})]
        (is (= tag ::lib/ok))
        (is (every? number? (map :d4 (latest-data dataset-id))))))

    (testing "Valid type check"
      (let [[tag _ status] (apply-transformation {:type :transformation
                                                  :transformation
                                                  (gen-transformation "core/derive"
                                                                      {::transformation.derive.s/newColumnTitle "Derived 6"
                                                                       ::transformation.derive.s/code "new Date()"
                                                                       ::transformation.derive.s/newColumnType "number"
                                                                       ::transformation.engine.s/onError "fail"})})]
        (is (= status "FAILED"))))

    (testing "Sandboxing java interop"
      (let [[tag _ status] (apply-transformation {:type :transformation
                                                  :transformation
                                                  (gen-transformation "core/derive"
                                                                      {::transformation.derive.s/newColumnTitle "Derived 7"
                                                                       ::transformation.derive.s/code "new java.util.Date()"
                                                                       ::transformation.derive.s/newColumnType "number"
                                                                       ::transformation.engine.s/onError "fail"})})]
        (is (= status "FAILED"))))

    (testing "Sandboxing dangerous js functions"
      (let [[tag _ status] (apply-transformation {:type :transformation
                                                  :transformation
                                                  (gen-transformation "core/derive"
                                                                      {::transformation.derive.s/newColumnTitle "Derived 7"
                                                                       ::transformation.derive.s/code "quit()"
                                                                       ::transformation.derive.s/newColumnType "number"
                                                                       ::transformation.engine.s/onError "fail"})})]
        (is (= status "FAILED"))))

    (testing "Fail early on syntax error"
      (let [[tag _] (apply-transformation {:type :transformation
                                           :transformation
                                           (gen-transformation "core/derive"
                                                               {::transformation.derive.s/newColumnTitle "Derived 8"
                                                                ::transformation.derive.s/code ")"
                                                                ::transformation.derive.s/newColumnType "text"
                                                                ::transformation.engine.s/onError "fail"})})]
        (is (= tag ::lib/bad-request))))

    (testing "Fail infinite loop"
      (let [[tag _] (apply-transformation {:type :transformation
                                           :transformation
                                           (gen-transformation "core/derive"
                                                               {::transformation.derive.s/newColumnTitle "Derived 9"
                                                                ::transformation.derive.s/code "while(true) {}"
                                                                ::transformation.derive.s/newColumnType "text"
                                                                ::transformation.engine.s/onError "fail"})})]
        (is (= tag ::lib/bad-request))))


    (testing "Disallow anonymous functions"
      (let [[tag _] (apply-transformation {:type :transformation
                                           :transformation
                                           (gen-transformation "core/derive"
                                                               {::transformation.derive.s/newColumnTitle "Derived 10"
                                                                ::transformation.derive.s/code "(function() {})()"
                                                                ::transformation.derive.s/newColumnType "text"
                                                                ::transformation.engine.s/onError "fail"})})]
        (is (= tag ::lib/bad-request)))

      (let [[tag _] (apply-transformation {:type :transformation
                                           :transformation
                                           (gen-transformation "core/derive"
                                                               {::transformation.derive.s/newColumnTitle "Derived 11"
                                                                ::transformation.derive.s/code "(() => 'foo')()"
                                                                ::transformation.derive.s/newColumnType "text"
                                                                ::transformation.engine.s/onError "fail"})})]
        (is (= tag ::lib/bad-request))))))

(deftest ^:functional split-column-test
  (let [dataset-id           (import-file *tenant-conn* *error-tracker* {:has-column-headers? true
                                                                         :file                "split_column.csv"})
        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} dataset-id)
        selectedColumn       (lumen.s/sample-with-gen* ::transformation.split-column.s/selectedColumn
                                                       {::db.dataset-version.column.s/columnName "c1"
                                                        :akvo.lumen.specs.import.column/header   #(s/gen :akvo.lumen.specs.import.column.text/header)})
        transformation       (gen-transformation :core/split-column
                                                 {::db.dataset-version.column.s/columnName "c1"
                                                  ::transformation.split-column.s/pattern  "%"
                                                  ::transformation.engine.s/onError        "fail"}
                                                 :selectedColumn selectedColumn)
        [tag _ :as all]      (apply-transformation {:type           :transformation
                                                    :transformation transformation})]
    (is (= ::lib/ok tag))
    (let [{:keys [columns transformations]} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                  {:dataset-id dataset-id})]
      (is (= ["c1" "c2" "d1" "d2" "d3"] (map #(get % "columnName") columns)))
      (let [data (latest-data dataset-id)]
        (is (= ["" "exam" "se"] (map :d1 data)))
        (is (= ["" "ple" "co"] (map :d2 data)))
        (is (= ["" "" "nd"] (map :d3 data)))))))

(deftest ^:functional split-column-test-quote-issue-1785
  (let [dataset-id           (import-file *tenant-conn* *error-tracker*
                                          {:has-column-headers? true
                                           :file                "split_column_1785.csv"})
        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} dataset-id)
        selectedColumn       (lumen.s/sample-with-gen* ::transformation.split-column.s/selectedColumn
                                                       {::db.dataset-version.column.s/columnName "c1"
                                                        ::import.column.s/header                 #(s/gen ::import.column.text.s/header)})
        transformation       (gen-transformation :core/split-column
                                                 {::db.dataset-version.column.s/columnName "c1"
                                                  ::transformation.split-column.s/pattern  "-"
                                                  ::transformation.engine.s/onError        "fail"}
                                                 :selectedColumn selectedColumn)
        c2-tx                (-> transformation
                                 (assoc-in ["args" "selectedColumn" "id"] "c2")
                                 (assoc-in ["args" "selectedColumn" "columnName"] "c2"))
        [tag _]              (apply-transformation {:type           :transformation
                                                    :transformation transformation})]
    (is (= ::lib/ok tag))
    (let [{:keys [columns transformations]} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                  {:dataset-id dataset-id})]
      (is (= ["c1" "c2" "d1" "d2"] (map #(get % "columnName") columns)))
      (let [data (latest-data dataset-id)]
        (is (= ["v1" "v2$"] (map :d1 data)))
        (is (= ["$1" "1"] (map :d2 data)))))
    (apply-transformation {:type :undo})
    (with-redefs [postgres/adapt-string-value (fn [v] (str "'" v "'::TEXT"))]

      (let [[tag _ status] (apply-transformation {:type           :transformation
                                                  :transformation c2-tx})]
        (is (= status "FAILED"))))
    (let [[tag _] (apply-transformation {:type           :transformation
                                         :transformation c2-tx})]
      (is (= ::lib/ok tag))
      (let [{:keys [columns transformations]} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                    {:dataset-id dataset-id})]
        (is (= ["c1" "c2" "d1" "d2"] (map #(get % "columnName") columns)))
        (let [data (latest-data dataset-id)]
          (is (= ["v1" "v2'"] (map :d1 data)))
          (is (= ["'2" "2"] (map :d2 data))))))))

(deftest ^:functional delete-column-test
  (let [dataset-id           (import-file *tenant-conn* *error-tracker*
                                          {:dataset-name "origin-dataset"
                                           :kind         "clj"
                                           :data         (import.s/sample-imported-dataset [:text :number :number :date :multiple] 2)})
        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} dataset-id)
        [tag _]              (apply-transformation {:type :transformation
                                                    :transformation
                                                    (gen-transformation "core/delete-column"
                                                                        {::db.dataset-version.column.s/columnName "c2"
                                                                         :transformation.engine.s/onError         "fail"})})]
    (is (= ::lib/ok tag))
    (let [{:keys [columns transformations]} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                  {:dataset-id dataset-id})]
      (is (= ["c1" "c3" "c4" "c5"] (map #(get % "columnName") columns)))
      (let [{:strs [before after]} (get-in (last transformations) ["changedColumns" "c2"])]
        (is (= "c2" (get before "columnName")))
        (is (nil? after))))))

(deftest ^:functional multiple-column-test
  (let [multiple-column-type       "caddisfly"
        {:keys [hasImage columns]} (:body (multiple-column/details {:caddisfly *caddisfly*} multiple-column-type import.values.s/cad1-id))
        bols                       (at-least-one-true (count columns))
        columns-payload            (mapv #(-> %
                                              (update :name (partial str "new-name-" %2 "-"))
                                              (assoc :extract %3))
                                         columns (range) bols)
        new-columns                (filter :extract columns-payload)
        data                       (-> (import.s/sample-imported-dataset
                                        [[:multiple {::import.column.multiple.s/header* #(s/gen ::import.column.multiple.caddisfly.s/header*)
                                                     ::import.column.multiple.s/value   #(s/gen #{import.values.s/cad1})}]
                                         [:multiple {::import.column.multiple.s/header* #(s/gen ::import.column.multiple.caddisfly.s/header*)
                                                     ::import.column.multiple.s/value #(s/gen #{import.values.s/cad2})}]] 2)
                                       (assoc-in [:columns 0 :multipleId] import.values.s/cad1-id)
                                       (assoc-in [:columns 1 :multipleId] import.values.s/cad2-id))
        dataset-id                 (import-file *tenant-conn* *error-tracker*
                                                {:dataset-name "multiple caddisfly"
                                                 :kind         "clj"
                                                 :data         data})
        apply-transformation       (partial async-tx-apply {:tenant-conn *tenant-conn* :caddisfly *caddisfly*} dataset-id)]
    (let [selected-column (merge
                           (lumen.s/sample-with-gen* ::transformation.split-column.s/selectedColumn
                                                     {::db.dataset-version.column.s/columnName "c1"})
                           (lumen.s/sample-with-gen* ::import.column.multiple.caddisfly.s/header*
                                                     {::import.values.s/multipleId import.values.s/cad1-id
                                                      ::import.values.s/id         "c1"}))
          [tag _ :as res] (apply-transformation
                           {:type :transformation
                            :transformation
                            (-> (gen-transformation :core/extract-multiple
                                                    {::db.dataset-version.column.s/columnName "c1"
                                                     ::transformation.split-column.s/pattern  "-"
                                                     ::transformation.engine.s/onError        "fail"}
                                                    :selectedColumn selected-column)
                                (update-in ["args" "extractImage"] (constantly true))
                                (assoc-in ["args" "columns"] (stringify-keys columns-payload)))})]
      (is (= ::lib/ok tag))
      (let [{:keys [columns transformations table-name]} (latest-dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id})]
        
        (is (= (apply conj ["c1" "c2"] (mapv (fn [idx] (str "d" idx)) (range 1 (inc (inc (count new-columns))))))
               (map #(get % "columnName") columns)))
        (is (= ["https://akvoflow-uat1.s3.amazonaws.com/images/b1961e99-bc1c-477c-9309-ae5e8d2374e8.png"
                "https://akvoflow-uat1.s3.amazonaws.com/images/b1961e99-bc1c-477c-9309-ae5e8d2374e8.png"]
               (mapv :d1 (get-data *tenant-conn* {:table-name table-name}))))
        (let [{:strs [before after]} (get-in (last transformations) ["changedColumns" "d2"])]
          (is (nil? before))
          (is (= 1 (get after "caddisfly-test-id")))
          (is (= (:name (nth new-columns 0)) (get after "title")))
          (is (= "d2" (get after "columnName"))))))
    (let [selected-column
          (merge
           (lumen.s/sample-with-gen* ::transformation.split-column.s/selectedColumn
                                     {::db.dataset-version.column.s/columnName "c2"})
           (lumen.s/sample-with-gen* ::import.column.multiple.caddisfly.s/header*
                                     {::import.values.s/multipleId import.values.s/cad2-id
                                      ::import.values.s/id         "c2"}))
          [tag _ :as res] (apply-transformation
                           {:type :transformation
                            :transformation
                            (-> (gen-transformation :core/extract-multiple
                                                    {::db.dataset-version.column.s/columnName "c2"
                                                     ::transformation.split-column.s/pattern  "-"
                                                     ::transformation.engine.s/onError        "fail"}
                                                    :selectedColumn selected-column)
                                (update-in ["args" "extractImage"] (constantly true))
                                (assoc-in ["args" "columns"] (stringify-keys columns-payload)))})]
      (is (= ::lib/ok tag))
      (let [{:keys [columns transformations table-name]} (latest-dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id})]
        (is (= [nil nil] (mapv :d3 (get-data *tenant-conn* {:table-name table-name}))))))))

(defn- replace-column
  "utility to have same column in other generated dataset"
  [origin-data target-data column-idx]
  (-> target-data
      (assoc-in [:columns column-idx]  (nth (:columns origin-data) column-idx))
      (assoc :rows (map #(assoc-in % [column-idx] (nth %2 column-idx)) (:rows target-data) (:rows origin-data)))))

(deftest ^:functional derive-category-number-test
  (let [column-vals          [1.0 2.0 3.0 4.0]
        origin-data          (import.s/sample-imported-dataset [[:number {::import.column.number.s/value #(s/gen (set column-vals))}]] 100)
        dataset-id           (import-file *tenant-conn* *error-tracker*
                                          {:dataset-name "origin-dataset"
                                           :kind         "clj"
                                           :data         origin-data})
        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} dataset-id)
        new-column-name      "Derived column name"
        uncategorized-value  "Uncategorised value"
        new-derived-column   {:sort       nil,
	                      :type       "text",
	                      :title      new-column-name
	                      :hidden     false,
	                      :direction  nil,
	                      :columnName "d1"}
        mappings*            [[[">=" 0] ["<=" 1] "one"]
                              [["=" 2] nil "two"]]
        tx                   (gen-transformation "core/derive-category"
                                                 {}
                                                 [:source :column :columnName] "c1"
                                                 [:target :column :title] new-column-name
                                                 [:derivation :mappings] mappings*
                                                 [:derivation :type] "number"
                                                 [:derivation :uncategorizedValue] uncategorized-value)

        [tag _ :as res] (apply-transformation {:type           :transformation
                                               :transformation tx})]
    (is (= (set column-vals)  (->> origin-data :rows (map (comp :value first)) distinct set)))

    (is (= ::lib/ok tag))
    (let [{:keys [columns transformations table-name]} (latest-dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id})
          data-db                                      (get-data *tenant-conn* {:table-name table-name})]
      (is (every? #(= (:d1 %) (derive-category/find-number-cat mappings* (:c1 %) uncategorized-value)) data-db))
      (is (= new-derived-column
             (keywordize-keys (last columns))))
      (let [applied-tx (keywordize-keys (last transformations))]
        (is (= (keywordize-keys tx) (select-keys applied-tx [:op :args])))
        (is (= {:d1
	        {:after
	         new-derived-column,
	         :before nil}} (:changedColumns applied-tx)))))))

(deftest ^:functional derive-category-text-test
  (let [column-vals          ["v1" "v2" "v3" "v4"]
        origin-data          (import.s/sample-imported-dataset [[:text {::import.column.text.s/value #(s/gen (set column-vals))}]] 100)
        dataset-id           (import-file *tenant-conn* *error-tracker*
                                          {:dataset-name "origin-dataset"
                                           :kind         "clj"
                                           :data         origin-data})
        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} dataset-id)
        new-column-name      "Derived column name"
        uncategorized-value  "Uncategorised value"
        new-derived-column   {:sort       nil,
	                      :type       "text",
	                      :title      new-column-name
	                      :hidden     false,
	                      :direction  nil,
	                      :columnName "d1"}
        mappings*            [[["v2" "v3"] "mapped-1"]
                              [["v4"] "mapped-2"]]
        tx                   (gen-transformation "core/derive-category"
                                                 {}
                                                 [:source :column :columnName] "c1"
                                                 [:target :column :title] new-column-name
                                                 [:derivation :mappings] mappings*
                                                 [:derivation :type] "text"
                                                 [:derivation :uncategorizedValue] uncategorized-value)

        [tag _ :as res] (apply-transformation {:type           :transformation
                                               :transformation tx})]
    (is (= (set column-vals)  (->> origin-data :rows (map (comp :value first)) distinct set)))

    (is (= ::lib/ok tag))
    (let [{:keys [columns transformations table-name]} (latest-dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id})
          data-db                                      (get-data *tenant-conn* {:table-name table-name})]
      (is (every? #(= (:d1 %) (derive-category/find-text-cat (derive-category/mappings-dict mappings*) (:c1 %) uncategorized-value)) data-db))
      (is (= new-derived-column
             (keywordize-keys (last columns))))
      (let [applied-tx (keywordize-keys (last transformations))]
        (is (= (keywordize-keys tx) (select-keys applied-tx [:op :args])))
        (is (= {:d1
	        {:after
	         new-derived-column,
	         :before nil}} (:changedColumns applied-tx)))))))

(deftest ^:functional merge-datasets-test
  (let [origin-data          (import.s/sample-imported-dataset [:text :date] 2)
        target-data          (replace-column origin-data (import.s/sample-imported-dataset [:text :number :number :text] 2) 0) 
        origin-dataset-id    (import-file *tenant-conn* *error-tracker*
                                          {:dataset-name "origin-dataset"
                                           :kind         "clj"
                                           :data         origin-data})
        target-dataset-id    (import-file *tenant-conn* *error-tracker*
                                          {:dataset-name "origin-dataset"
                                           :kind         "clj"
                                           :data         target-data})
        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} origin-dataset-id)
        tx                   (gen-transformation "core/merge-datasets"
                                                 {::transformation.merge-datasets.source.s/mergeColumn          "c1"
                                                  ::transformation.merge-datasets.source.s/aggregationDirection "DESC"
                                                  ::transformation.merge-datasets.source.s/mergeColumns         ["c4" "c3" "c2"]
                                                  ::transformation.merge-datasets.target.s/mergeColumn          "c1"}
                                                 [:source :aggregationColumn] nil
                                                 [:source :datasetId] target-dataset-id)
        [tag _ :as res] (apply-transformation {:type           :transformation
                                               :transformation tx})]
    (is (= ::lib/ok tag))
    (let [{:keys [columns transformations table-name]} (latest-dataset-version-by-dataset-id *tenant-conn* {:dataset-id origin-dataset-id})
          data-db                                      (get-data *tenant-conn* {:table-name table-name})]
      (is (=  (map (comp name :type) (apply conj
                                            (:columns origin-data)
                                            (next (:columns target-data))))
              (map #(get % "type") columns)))
      (is (= '(:c1 :c2 :d1 :d2 :d3) (map #(keyword (get % "columnName")) columns)))
      (is (= 2 (count data-db)))
      (is (= (map (comp :value first) (:rows origin-data)) (map :c1 data-db)))
      (is (= (map (comp :value last) (:rows target-data)) (map :d3 data-db))))))

(deftest ^:functional reverse-geocode-test
  (let [geoshape-data (import.s/sample-imported-dataset
              [:text
               [:geoshape {:import.column.geoshape.s/value #(s/gen #{(Geoshape. import.values.s/polygon)})}]]
              2)
        geopoint-data (import.s/sample-imported-dataset
                       [:text
                        :geopoint]
                       2)
        geoshape-dataset-id (import-file *tenant-conn* *error-tracker*
                                         {:dataset-name "dataset-with-geoshape"
                                          :kind         "clj"
                                          :data         geoshape-data})
        geopoint-dataset-id (import-file *tenant-conn* *error-tracker*
                                         {:dataset-name "dataset-with-geopoint"
                                          :kind         "clj"
                                          :data         geopoint-data})
        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} geopoint-dataset-id)
        [tag _] (apply-transformation {:type :transformation
                                       :transformation
                                       (gen-transformation :core/reverse-geocode
                                                           {::db.dataset-version.s/dataset-id geoshape-dataset-id}
                                                           [:source :geoshapeColumn] "c2"
                                                           [:source :mergeColumn] "c1"
                                                           [:target :geopointColumn] "c2"
                                                           [:target :title] "reverse-geocode-new-column"
                                                           )})]
    (is (= ::lib/ok tag))))


(deftest ^:functional rename-column-test
  (let [dataset-id           (import-file *tenant-conn* *error-tracker* {:has-column-headers? true
                                                                         :file                "dates.csv"})
        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} dataset-id)
        [tag _]              (apply-transformation {:type :transformation
                                                    :transformation
                                                    (gen-transformation "core/rename-column"
                                                                        {::transformation.derive.s/newColumnTitle    "New Title"
                                                                         ::transformation.rename-column.s/columnName "c2"
                                                                         ::transformation.engine.s/onError           "fail"})})]
    (is (= ::lib/ok tag))
    (let [{:keys [columns transformations]} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                  {:dataset-id dataset-id})]
      (is (= "New Title" (get-in (vec columns) [1 "title"])))
      (let [{:strs [before after]} (get-in (last transformations) ["changedColumns" "c2"])]
        (is (= "dd/mm/yyyy" (get before "title")))
        (is (= "New Title" (get after "title")))))))

;; Regression #808
(deftest valid-column-names
  (is (engine/valid?
       (gen-transformation "core/sort-column"
                           {::transformation.sort-column.s/sortDirection "ASC"
                            ::transformation.sort-column.s/columnName    "submitted_at"
                            ::transformation.engine.s/onError            "fail"})))

  (is (engine/valid?
       (gen-transformation :core/remove-sort
                           {::transformation.remove-sort.s/columnName "c3"
                            ::transformation.engine.s/onError         "fail"})))

  (are [derived cols] (= derived (engine/next-column-name cols))
    "d1" []
    "d1" [{"columnName" "dx"}]
    "d2" [{"columnName" "d1"}]
    "d6" [{"columnName" "submitter"} {"columnName" "d5"} {"columnName" "dx"}]))

(deftest ^:functional generate-geopoints-test
  (let [dataset-id           (import-file *tenant-conn* *error-tracker* {:has-column-headers? true
                                                                         :file                "geopoints.csv"})
        apply-transformation (partial async-tx-apply {:tenant-conn *tenant-conn*} dataset-id)
        [tag _]              (apply-transformation {:type :transformation
                                                    :transformation
                                                    (gen-transformation "core/generate-geopoints"
                                                                        {::transformation.generate-geopoints.s/columnTitleGeo "Geopoints"
                                                                         ::transformation.generate-geopoints.s/columnNameLong "c3"
                                                                         ::transformation.generate-geopoints.s/columnNameLat  "c2"
                                                                         ::transformation.engine.s/onError                    "fail"})})]
    (is (= ::lib/ok tag))
    (let [dataset             (latest-dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id})
          {:keys [columns _]} dataset]
      (is (= 4 (count columns)))
      (is (= "geopoint" (get (last columns) "type")))
      (is (= "d1" (get (last columns) "columnName"))))))


