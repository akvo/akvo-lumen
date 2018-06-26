(ns akvo.lumen.transformation-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         *error-tracker*
                                         error-tracker-fixture]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.utils.specs]
            [akvo.lumen.test-utils :refer [import-file instrument-fixture with-instrument-disabled]]
            [akvo.lumen.transformation :as tf]
            [akvo.lumen.transformation.engine :as engine]
            [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.test :refer :all]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql])
  (:import [clojure.lang ExceptionInfo]))

(def ops (vec (json/parse-string (slurp (io/resource "ops.json")))))

(def invalid-op (-> (take 3 ops)
                    vec
                    (update-in [1 "args"] dissoc "parseFormat")))

(hugsql/def-db-fns "akvo/lumen/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/transformation_test.sql")
(hugsql/def-db-fns "akvo/lumen/transformation.sql")

(use-fixtures :once tenant-conn-fixture error-tracker-fixture instrument-fixture)

(deftest op-validation
  (testing "op validation"
    (is (= true (every? true? (map engine/valid? ops))))
    (let [result (tf/validate {:type :transformation :transformation (second invalid-op)})]
      (is (= false (:valid? result)))
      (is (= (format "Invalid transformation %s" (second invalid-op)) (:message result))))))

(deftest ^:functional test-transformations
  (testing "Transformation application"
    (is (= [::lib/bad-request {"message" "Dataset not found"}]
           (with-instrument-disabled (tf/apply *tenant-conn* "Not-valid-id" [])))))
  (testing "Valid log"
    (let [dataset-id (import-file *tenant-conn* *error-tracker*
                                  "transformation_test.csv" {:name "Transformation Test"
                                                             :has-column-headers? true})
          [tag _] (last (for [transformation ops]
                          (tf/apply *tenant-conn* dataset-id {:type :transformation
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
          dataset-id (import-file *tenant-conn* *error-tracker* "GDP.csv" {:name "GDP Test" :has-column-headers? false})]
      (let [[tag {:strs [datasetId]}] (last (for [transformation t-log]
                                              (tf/apply *tenant-conn*
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
  (let [dataset-id (import-file *tenant-conn* *error-tracker* "GDP.csv" {:dataset-name "GDP Undo Test"})
        {previous-table-name :table-name} (latest-dataset-version-by-dataset-id *tenant-conn*
                                                                                {:dataset-id dataset-id})
        apply-transformation (partial tf/apply *tenant-conn* dataset-id)]
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
  (let [dataset-id (import-file *tenant-conn* *error-tracker* "name.csv" {:has-column-headers? true})
        apply-transformation (partial tf/apply *tenant-conn* dataset-id)]
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
                                         :table-name table-name}))))))))

(defn date-transformation [column-name format]
  {:type :transformation
   :transformation {"op" "core/change-datatype"
                    "args" {"columnName" column-name
                            "newType" "date"
                            "defaultValue" 0
                            "parseFormat" format}
                    "onError" "fail"}})

(deftest ^:functional date-parsing-test
  (let [dataset-id (import-file *tenant-conn* *error-tracker* "dates.csv" {:has-column-headers? true})
        apply-transformation (partial tf/apply *tenant-conn* dataset-id)]
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
  (let [dataset-id (import-file *tenant-conn* *error-tracker* "derived-column.csv" {:has-column-headers? true})
        apply-transformation (partial tf/apply *tenant-conn* dataset-id)]
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

    (with-instrument-disabled
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
          (is (= tag ::lib/bad-request)))))))


(deftest ^:functional delete-column-test
  (let [dataset-id (import-file *tenant-conn* *error-tracker* "dates.csv" {:has-column-headers? true})
        apply-transformation (partial tf/apply *tenant-conn* dataset-id)]
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

(deftest ^:functional rename-column-test
  (let [dataset-id (import-file *tenant-conn* *error-tracker* "dates.csv" {:has-column-headers? true})
        apply-transformation (partial tf/apply *tenant-conn* dataset-id)]
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
  (let [column #(merge % {:type "text" :title "title" :hidden true :direction nil})]
    (are [derived cols] (= derived (engine/next-column-name cols))
      "d1" []
      "d1" [(column {:columnName "dx"})]
      "d2" [(column {:columnName "d1"})]
      "d6" [(column {:columnName "submitter"}) (column {:columnName "d5"}) (column {:columnName "dx"})])))

(deftest ^:functional generate-geopoints-test
  (let [dataset-id (import-file *tenant-conn* *error-tracker* "geopoints.csv" {:has-column-headers? true})
        apply-transformation (partial tf/apply *tenant-conn* dataset-id)]
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
