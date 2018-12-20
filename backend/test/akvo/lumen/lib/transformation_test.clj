(ns akvo.lumen.lib.transformation-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         *error-tracker*
                                         error-tracker-fixture
                                         *caddisfly*
                                         caddisfly-fixture]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.multiple-column :as multiple-column]
            [akvo.lumen.lib.transformation :as tf]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.specs.import :as i-c]
            [akvo.lumen.specs.import.values :as i-v]
            [akvo.lumen.test-utils :refer [import-file at-least-one-true]]
            [akvo.lumen.test-utils :as tu]
            [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.spec.alpha :as s]
            [clojure.test :refer :all]
            [clojure.tools.logging :as log]
            [clojure.walk :refer (stringify-keys)]
            [hugsql.core :as hugsql]))

(def ops (vec (json/parse-string (slurp (io/resource "ops.json")))))

(def invalid-op (-> (take 3 ops)
                    vec
                    (update-in [1 "args"] dissoc "parseFormat")))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation_test.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")

(use-fixtures :once tu/spec-instrument caddisfly-fixture tenant-conn-fixture error-tracker-fixture)

(deftest op-validation
  (testing "op validation"
    (doseq [op ops]
      (is (engine/valid? op) (str op)))
    (let [result (tf/validate {:type :transformation :transformation (second invalid-op)})]
      (is (= false (:valid? result)))
      (is (= (format "Invalid transformation %s" (second invalid-op)) (:message result))))))

(deftest ^:functional test-transformations
  (testing "Transformation application"
    (is (= [::lib/bad-request {"message" "Dataset not found"}]
           (tf/apply {:tenant-conn *tenant-conn*} "Not-valid-id" []))))
  (testing "Valid log"
    (let [dataset-id (import-file *tenant-conn* *error-tracker* {:name "Transformation Test"
                                                                 :has-column-headers? true
                                                                 :file "transformation_test.csv"})
          [tag _] (last (for [transformation ops]
                          (tf/apply {:tenant-conn *tenant-conn*} dataset-id {:type :transformation
                                                              :transformation transformation})))]
      (is (= ::lib/ok tag)))))

(deftest ^:functional test-import-and-transform
  (testing "Import CSV and transform"
    (let [t-log [{"op" "core/trim"
                  "args" {"columnName" "c5"}
                  "onError" "fail"}
                 {"op" "core/change-datatype"
                  "args" {"columnName" "c5"
                          "newType" "number"
                          "defaultValue" 0}
                  "onError" "default-value"}
                 {"op" "core/filter-column"
                  "args" {"columnName" "c4"
                          "expression" {"contains" "broken"}}
                  "onError" "fail"}]
          dataset-id (import-file *tenant-conn* *error-tracker* {:name "GDP Test"
                                                                 :has-column-headers? false
                                                                 :file "GDP.csv"})]
      (let [[tag {:strs [datasetId]}] (last (for [transformation t-log]
                                              (tf/apply {:tenant-conn *tenant-conn*}
                                                        dataset-id
                                                        {:type :transformation
                                                         :transformation transformation})))]

        (is (= ::lib/ok tag))

        (let [table-name (:table-name (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                            {:dataset-id datasetId}))]
          (is (zero? (:c5 (get-val-from-table *tenant-conn*
                                              {:rnum 196
                                               :column-name "c5"
                                               :table-name table-name}))))
          (is (= "[Broken]" (:c4 (get-val-from-table *tenant-conn* {:rnum 196
                                                                    :column-name "c4"
                                                                    :table-name table-name}))))
          (is (= 1 (:total (get-row-count *tenant-conn* {:table-name table-name})))))))))

(deftest ^:functional test-undo
  (let [dataset-id (import-file *tenant-conn* *error-tracker* {:dataset-name "GDP Undo Test"
                                                               :file "GDP.csv"})
        {previous-table-name :table-name} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                {:dataset-id dataset-id})
        apply-transformation (partial tf/apply {:tenant-conn *tenant-conn*} dataset-id)]
    (is (= ::lib/ok (first (apply-transformation {:type :undo}))))
    (let [[tag _] (do (apply-transformation {:type :transformation
                                             :transformation {"op" "core/to-lowercase"
                                                              "args" {"columnName" "c1"}
                                                              "onError" "fail"}})
                      (apply-transformation {:type :transformation
                                             :transformation {"op" "core/change-datatype"
                                                              "args" {"columnName" "c5"
                                                                      "newType" "number"
                                                                      "defaultValue" 0}
                                                              "onError" "default-value"}})
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
        apply-transformation (partial tf/apply {:tenant-conn *tenant-conn*} dataset-id)]
    (let [[tag _] (apply-transformation {:type :transformation
                                         :transformation {"op" "core/combine"
                                                          "args" {"columnNames" ["c1" "c2"]
                                                                  "newColumnTitle" "full name"
                                                                  "separator" " "}
                                                          "onError" "fail"}})]
      (is (= ::lib/ok tag))
      (let [table-name (:table-name
                        (latest-dataset-version-by-dataset-id *tenant-conn*
                                                              {:dataset-id dataset-id}))]
        (is (= "bob hope"
               (:d1 (get-val-from-table *tenant-conn*
                                        {:rnum 1
                                         :column-name "d1"
                                         :table-name table-name}))))))

    ;;https://github.com/akvo/akvo-lumen/issues/1517
    (testing "Combining columns where one of the columns has empty values"
      (let [[tag _] (apply-transformation {:type :transformation
                                           :transformation {"op" "core/combine"
                                                            "args" {"columnNames" ["c2" "c3"]
                                                                    "newColumnTitle" "issue1517"
                                                                    "separator" " "}
                                                            "onError" "fail"}})]
        (is (= ::lib/ok tag))
        (let [table-name (:table-name
                          (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                {:dataset-id dataset-id}))]
          (is (= "hope "
                 (:d2 (get-val-from-table *tenant-conn*
                                          {:rnum 1
                                           :column-name "d2"
                                           :table-name table-name})))))))
    ))

(defn date-transformation [column-name format]
  {:type :transformation
   :transformation {"op" "core/change-datatype"
                    "args" {"columnName" column-name
                            "newType" "date"
                            "defaultValue" 0
                            "parseFormat" format}
                    "onError" "fail"}})

(deftest ^:functional date-parsing-test
  (let [dataset-id (import-file *tenant-conn* *error-tracker* {:has-column-headers? true
                                                               :file "dates.csv"})
        apply-transformation (partial tf/apply {:tenant-conn *tenant-conn*} dataset-id)]
    (let [[tag {:strs [datasetId]}] (do (apply-transformation (date-transformation "c1" "YYYY"))
                                        (apply-transformation (date-transformation "c2" "DD/MM/YYYY"))
                                        (apply-transformation (date-transformation "c3" "YYYY-MM-DD")))]
      (is (= ::lib/ok tag))
      (let [table-name (:table-name (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                          {:dataset-id datasetId}))
            first-date (:c1 (get-val-from-table *tenant-conn*
                                                {:rnum 1
                                                 :column-name "c1"
                                                 :table-name table-name}))
            second-date (:c2 (get-val-from-table *tenant-conn*
                                                 {:rnum 1
                                                  :column-name "c2"
                                                  :table-name table-name}))
            third-date (:c3 (get-val-from-table *tenant-conn*
                                                {:rnum 1
                                                 :column-name "c3"
                                                 :table-name table-name}))]
        (is (pos? first-date))
        (is (pos? second-date))
        (is (pos? third-date))))))

(defn change-datatype-transformation [column-name]
  {:type :transformation
   :transformation {"op" "core/change-datatype"
                    "args" {"columnName" column-name
                            "newType" "number"
                            "defaultValue" nil}
                    "onError" "default-value"}})

(defn derive-column-transform [transform]
  (let [default-args {"newColumnTitle" "Derived Column"
                      "newColumnType" "number"}
        args (merge default-args
                    (get transform "args"))
        default-transform {"op" "core/derive"
                           "onError" "leave-empty"}]
    {:type :transformation
     :transformation (merge default-transform
                            (assoc transform "args" args))}))

(defn latest-data [dataset-id]
  (let [table-name (:table-name
                    (latest-dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id}))]
    (get-data *tenant-conn* {:table-name table-name})))

(deftest ^:functional derived-column-test
  (let [dataset-id (import-file *tenant-conn* *error-tracker* {:has-column-headers? true
                                                               :file "derived-column.csv"})
        apply-transformation (partial tf/apply {:tenant-conn *tenant-conn*} dataset-id)]
    (do (apply-transformation (change-datatype-transformation "c2"))
        (apply-transformation (change-datatype-transformation "c3")))

    (testing "Import and initial transforms"
      (is (= (latest-data dataset-id)
             [{:rnum 1 :c1 "a" :c2 1.0 :c3 2.0}
              {:rnum 2 :c1 "b" :c2 3.0 :c3 nil}
              {:rnum 3 :c1 nil :c2 4.0 :c3 5.0}])))

    (testing "Basic text transform"
      (apply-transformation (derive-column-transform
                             {"args" {"code" "row['foo'].toUpperCase()"
                                      "newColumnTitle" "Derived 1"
                                      "newColumnType" "text"}
                              "onError" "leave-empty"}))
      (is (= ["A" "B" nil] (map :d1 (latest-data dataset-id)))))

    (testing "Basic text transform with drop row on error"
      (apply-transformation (derive-column-transform
                             {"args" {"code" "row['foo'].replace('a', 'b')"
                                      "newColumnTitle" "Derived 3"
                                      "newColumnType" "text"}
                              "onError" "delete-row"}))
      (is (= ["b" "b"] (map :d2 (latest-data dataset-id))))
      ;; Undo this so we have all the rows in the remaining tests
      (apply-transformation {:type :undo}))

    (testing "Basic text transform with abort"
      (apply-transformation (derive-column-transform
                             {"args" {"code" "row['foo'].length"
                                      "newColumnTitle" "Derived 2"
                                      "newColumnType" "number"}
                              "onError" "fail"}))
      (is (-> (latest-data dataset-id)
              first
              keys
              set
              (contains? :d2)
              not)))

    (testing "Nested string transform"
      (apply-transformation (derive-column-transform
                             {"args" {"code" "row['foo'].toUpperCase()"
                                      "newColumnType" "text"
                                      "newColumnTitle" "Derived 4"}}))
      (is (= ["A" "B" nil] (map :d2 (latest-data dataset-id))))

      (apply-transformation (derive-column-transform
                             {"args" {"code" "row['Derived 4'].toLowerCase()"
                                      "newColumnType" "text"
                                      "newColumnTitle" "Derived 5"}}))
      (is (= ["a" "b" nil] (map :d3 (latest-data dataset-id)))))

    (testing "Date transform"
      (let [[tag _] (apply-transformation (derive-column-transform
                                           {"args" {"code" "new Date()"
                                                    "newColumnType" "date"
                                                    "newColumnTitle" "Derived 5"}
                                            "onError" "fail"}))]
        (is (= tag ::lib/ok))
        (is (every? number? (map :d4 (latest-data dataset-id))))))

    (testing "Valid type check"
      (let [[tag _] (apply-transformation (derive-column-transform
                                           {"args" {"code" "new Date()"
                                                    "newColumnType" "number"
                                                    "newColumnTitle" "Derived 6"}
                                            "onError" "fail"}))]
        (is (= tag ::lib/conflict))))

    (testing "Sandboxing java interop"
      (let [[tag _] (apply-transformation (derive-column-transform
                                           {"args" {"code" "new java.util.Date()"
                                                    "newColumnType" "number"
                                                    "newColumnTitle" "Derived 7"}
                                            "onError" "fail"}))]
        (is (= tag ::lib/conflict))))

    (testing "Sandboxing dangerous js functions"
      (let [[tag _] (apply-transformation (derive-column-transform
                                           {"args" {"code" "quit()"
                                                    "newColumnType" "number"
                                                    "newColumnTitle" "Derived 7"}
                                            "onError" "fail"}))]
        (is (= tag ::lib/conflict))))

    (testing "Fail early on syntax error"
      (let [[tag _] (apply-transformation (derive-column-transform
                                           {"args" {"code" ")"
                                                    "newColumnType" "text"
                                                    "newColumnTitle" "Derived 8"}
                                            "onError" "fail"}))]
        (is (= tag ::lib/bad-request))))

    (testing "Fail infinite loop"
      (let [[tag _] (apply-transformation (derive-column-transform
                                           {"args" {"code" "while(true) {}"
                                                    "newColumnType" "text"
                                                    "newColumnTitle" "Derived 9"}
                                            "onError" "fail"}))]
        (is (= tag ::lib/bad-request))))


    (testing "Disallow anonymous functions"
      (let [[tag _] (apply-transformation (derive-column-transform
                                           {"args" {"code" "(function() {})()"
                                                    "newColumnType" "text"
                                                    "newColumnTitle" "Derived 10"}
                                            "onError" "fail"}))]
        (is (= tag ::lib/bad-request)))

      (let [[tag _] (apply-transformation (derive-column-transform
                                           {"args" {"code" "(() => 'foo')()"
                                                    "newColumnType" "text"
                                                    "newColumnTitle" "Derived 11"}
                                            "onError" "fail"}))]
        (is (= tag ::lib/bad-request))))))

(deftest ^:functional split-column-test
  (let [dataset-id (import-file *tenant-conn* *error-tracker* {:has-column-headers? true
                                                               :file "split_column.csv"})
        apply-transformation (partial tf/apply {:tenant-conn *tenant-conn*} dataset-id)]
    (let [[tag _] (apply-transformation {:type :transformation
                                         :transformation {"op" "core/split-column"
                                                          "args" {"pattern" "%"
                                                                  "newColumnName" "splitted"
                                                                  "selectedColumn" {"columnName" "c1"}}
                                                          "onError" "fail"}})]
      (is (= ::lib/ok tag))
      (let [{:keys [columns transformations]} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                    {:dataset-id dataset-id})]
        (is (= ["c1" "c2" "d1" "d2" "d3"] (map #(get % "columnName") columns)))
        (let [data (latest-data dataset-id)]
          (is (= ["" "exam" "se"] (map :d1 data)))
          (is (= ["" "ple" "co"] (map :d2 data)))
          (is (= ["" "" "nd"] (map :d3 data))))))))

(deftest ^:functional split-column-test-quote-issue-1785
  (let [dataset-id (import-file *tenant-conn* *error-tracker* {:has-column-headers? true
                                                               :file "split_column_1785.csv"})
        apply-transformation (partial tf/apply {:tenant-conn *tenant-conn*} dataset-id)]
    (let [[tag _] (apply-transformation {:type :transformation
                                         :transformation {"op" "core/split-column"
                                                          "args" {"pattern" "-"
                                                                  "newColumnName" "splitted"
                                                                  "selectedColumn" {"columnName" "c1"}}
                                                          "onError" "fail"}})]
      (is (= ::lib/ok tag))
      (let [{:keys [columns transformations]} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                    {:dataset-id dataset-id})]
        (is (= ["c1" "c2" "d1" "d2"] (map #(get % "columnName") columns)))
        (let [data (latest-data dataset-id)]
          (is (= ["v1" "v2$"] (map :d1 data)))
          (is (= ["$1" "1"] (map :d2 data))))))
    (apply-transformation {:type :undo})
    (with-redefs [postgres/adapt-string-value (fn [v] (str "'" v "'::TEXT"))]

      (let [[tag _] (apply-transformation {:type :transformation
                                           :transformation {"op" "core/split-column"
                                                            "args" {"pattern" "-"
                                                                    "newColumnName" "splitted"
                                                                    "selectedColumn" {"columnName" "c2"}}
                                                            "onError" "fail"}})]
        (is (= ::lib/conflict tag))))
    (let [[tag _] (apply-transformation {:type :transformation
                                         :transformation {"op" "core/split-column"
                                                          "args" {"pattern" "-"
                                                                  "newColumnName" "splitted"
                                                                  "selectedColumn" {"columnName" "c2"}}
                                                          "onError" "fail"}})]
      (is (= ::lib/ok tag))
      (let [{:keys [columns transformations]} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                    {:dataset-id dataset-id})]
        (is (= ["c1" "c2" "d1" "d2"] (map #(get % "columnName") columns)))
        (let [data (latest-data dataset-id)]
          (is (= ["v1" "v2'"] (map :d1 data)))
          (is (= ["'2" "2"] (map :d2 data))))))))

(deftest ^:functional delete-column-test
  (let [dataset-id (import-file *tenant-conn* *error-tracker* {:has-column-headers? true
                                                               :file "dates.csv"})
        apply-transformation (partial tf/apply {:tenant-conn *tenant-conn*} dataset-id)]
    (let [[tag _] (apply-transformation {:type :transformation
                                         :transformation {"op" "core/delete-column"
                                                          "args" {"columnName" "c2"}
                                                          "onError" "fail"}})]
      (is (= ::lib/ok tag))
      (let [{:keys [columns transformations]} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                    {:dataset-id dataset-id})]
        (is (= ["c1" "c3" "c4"] (map #(get % "columnName") columns)))
        (let [{:strs [before after]} (get-in (last transformations) ["changedColumns" "c2"])]
          (is (= "c2" (get before "columnName")))
          (is (nil? after)))))))

(alias 'c.multiple 'akvo.lumen.specs.import.column.multiple)

(deftest ^:functional multiple-column-test
  (let [multiple-column-type "caddisfly"
        {:keys [hasImage columns]} (:body (multiple-column/details {:caddisfly *caddisfly*} multiple-column-type i-v/cad1-id))
        bols (at-least-one-true (count columns))
        columns-payload (mapv #(-> %
                                   (update :name (partial str "new-name-" %2 "-"))
                                   (assoc :extract %3))
                              columns (range) bols)
        new-columns (filter :extract columns-payload)
        data (i-c/sample-imported-dataset [[:multiple {::i-v/multiple-id #(s/gen #{i-v/cad1-id})
                                                       ::c.multiple/value #(s/gen #{i-v/cad1})}]] 2)
        dataset-id (import-file *tenant-conn* *error-tracker*
                                {:dataset-name "multiple caddisfly"
                                 :kind "clj"
                                 :data data})
        apply-transformation (partial tf/apply {:tenant-conn *tenant-conn*} dataset-id)]
    (let [[tag _ :as res] (apply-transformation {:type :transformation
                                                 :transformation {"op" "core/extract-multiple"
                                                                  "args" {"columns" (stringify-keys columns-payload)
                                                                          "selectedColumn" {"multipleType" multiple-column-type
                                                                                            "multipleId" i-v/cad1-id
                                                                                            "columnName" "c0"}
                                                                          "columnName" "c0"
                                                                          "extractImage" false}
                                                                  "onError" "fail"}})]
      (is (= ::lib/ok tag))
      (let [{:keys [columns transformations]} (latest-dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id})]
        
        (is (= (apply conj ["c0"] (mapv (fn [idx] (str "d" idx)) (range 1 (inc (count new-columns)))))
               (map #(get % "columnName") columns)))
        (let [{:strs [before after]} (get-in (last transformations) ["changedColumns" "d1"])]
          (is (nil? before))
          (is (= 1 (get after "caddisfly-test-id")))
          (is (= (:name (nth new-columns 0)) (get after "title")))
          (is (= "d1" (get after "columnName"))))))))

(deftest ^:functional rename-column-test
  (let [dataset-id (import-file *tenant-conn* *error-tracker* {:has-column-headers? true
                                                               :file "dates.csv"})
        apply-transformation (partial tf/apply {:tenant-conn *tenant-conn*} dataset-id)]
    (let [[tag _] (apply-transformation {:type :transformation
                                         :transformation {"op" "core/rename-column"
                                                          "args" {"columnName" "c2"
                                                                  "newColumnTitle" "New Title"}
                                                          "onError" "fail"}})]
      (is (= ::lib/ok tag))
      (let [{:keys [columns transformations]} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                    {:dataset-id dataset-id})]
        (is (= "New Title" (get-in (vec columns) [1 "title"])))
        (let [{:strs [before after]} (get-in (last transformations) ["changedColumns" "c2"])]
          (is (= "dd/mm/yyyy" (get before "title")))
          (is (= "New Title" (get after "title"))))))))

;; Regression #808
(deftest valid-column-names
  (is (engine/valid? {"op" "core/sort-column"
                      "args" {"columnName" "submitted_at"
                              "sortDirection" "ASC"}
                      "onError" "fail"}))

  (is (engine/valid? {"op" "core/remove-sort"
                      "args" {"columnName" "c3"}
                      "onError" "fail"}))

  (are [derived cols] (= derived (engine/next-column-name cols))
    "d1" []
    "d1" [{"columnName" "dx"}]
    "d2" [{"columnName" "d1"}]
    "d6" [{"columnName" "submitter"} {"columnName" "d5"} {"columnName" "dx"}]))

(deftest ^:functional generate-geopoints-test
  (let [dataset-id (import-file *tenant-conn* *error-tracker* {:has-column-headers? true
                                                               :file "geopoints.csv"})
        apply-transformation (partial tf/apply {:tenant-conn *tenant-conn*} dataset-id)]
    (let [[tag _] (apply-transformation {:type :transformation
                                         :transformation {"op" "core/generate-geopoints"
                                                          "args" {"columnNameLat" "c2"
                                                                  "columnNameLong" "c3"
                                                                  "columnTitleGeo" "Geopoints"}
                                                          "onError" "fail"}})]
      (is (= ::lib/ok tag))
      (let [dataset (latest-dataset-version-by-dataset-id *tenant-conn* {:dataset-id dataset-id})
            {:keys [columns _]} dataset]
        (is (= 4 (count columns)))
        (is (= "geopoint" (get (last columns) "type")))
        (is (= "d1" (get (last columns) "columnName")))))))
