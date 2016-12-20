(ns akvo.lumen.transformation-test
  (:require [akvo.lumen.component.tenant-manager :refer [tenant-manager]]
            [akvo.lumen.component.transformation-engine :refer [transformation-engine]]
            [akvo.lumen.fixtures :refer [test-conn
                                         test-tenant-spec
                                         migrate-tenant
                                         rollback-tenant]]
            [akvo.lumen.import :as imp]
            [akvo.lumen.import.csv-test :refer [import-file]]
            [akvo.lumen.transformation :as tf]
            [akvo.lumen.util :refer (squuid)]
            [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.test :refer :all]
            [com.stuartsierra.component :as component]
            [duct.component.hikaricp :refer [hikaricp]]
            [hugsql.core :as hugsql]))

(def ops (vec (json/parse-string (slurp (io/resource "ops.json")))))
(def invalid-op (-> (take 3 ops)
                    vec
                    (update-in [1 "args"] dissoc "parseFormat")))


(hugsql/def-db-fns "akvo/lumen/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/transformation_test.sql")
(hugsql/def-db-fns "akvo/lumen/transformation.sql")

(def ^:dynamic *transformation-engine*)

(def transformation-test-system
  (->
   (component/system-map
    :transformation-engine (transformation-engine {})
    :tenant-manager (tenant-manager {})
    :db (hikaricp {:uri (:db_uri test-tenant-spec)}))
   (component/system-using
    {:transformation-engine [:tenant-manager]
     :tenant-manager [:db]})))

(defn new-fixture [f]
  (alter-var-root #'transformation-test-system component/start)
  (binding [*transformation-engine*
            (:transformation-engine transformation-test-system)]
    (f)
    (alter-var-root #'transformation-test-system component/stop)))

(defn test-fixture
  [f]
  (rollback-tenant test-tenant-spec)
  (migrate-tenant test-tenant-spec)
  (rollback-test-data test-conn)
  (new-test-table test-conn)
  (new-test-data test-conn)
  (f))

(use-fixtures :once test-fixture new-fixture)

(deftest op-validation
  (testing "op validation"
    (is (= true (every? true? (map tf/validate-op ops))))
    (let [result (tf/validate {:type :transformation :transformation (second invalid-op)})]
      (is (= false (:valid? result)))
      (is (= (format "Invalid transformation %s" (second invalid-op)) (:message result))))))

(deftest ^:functional test-transformations
  (testing "Transformation application"
    (is (= {:status 400 :body {:message "Dataset not found"}}
           (tf/schedule test-conn *transformation-engine* "Not-valid-id" []))))
  (testing "Valid log"
    (let [resp (last (for [transformation ops]
                       (tf/schedule test-conn *transformation-engine* "ds-1" {:type :transformation
                                                                              :transformation transformation})))]
      (is (= 200 (:status resp))))))

(deftest ^:functional test-import-and-transform
  (testing "Import CSV and transform"
    (let [data-source-id (str (squuid))
          job-id (str (squuid))
          data-source-spec {"name" "GDP Test"
                            "source" {"path" (.getAbsolutePath (io/file (io/resource "GDP.csv")))
                                      "kind" "DATA_FILE"
                                      "fileName" "GDP.csv"
                                      "hascolumnheaders" false}}
          t-log [{"op" "core/trim"
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
                  "onError" "fail"}]]

      (insert-data-source test-conn {:id data-source-id
                                     :spec (json/generate-string data-source-spec)})
      (insert-job-execution test-conn {:id job-id
                                       :data-source-id data-source-id})
      (imp/do-import test-conn {:file-upload-path "/tmp/akvo/dash"} job-id)

      (let [dataset-id (:dataset_id (dataset-id-by-job-execution-id test-conn {:id job-id}))
            transformation-job (last (for [transformation t-log]
                                       (tf/schedule test-conn
                                                    *transformation-engine*
                                                    dataset-id
                                                    {:type :transformation
                                                     :transformation transformation})))
            t-job-id (get-in transformation-job [:body :jobExecutionId])]

        (is (= 200 (:status transformation-job)))

        (is (= "OK" (:status (job-execution-status test-conn {:id t-job-id}))))

        (let [table-name (:table-name (get-table-name test-conn
                                                      {:job-id t-job-id}))]
          (is (zero? (:c5 (get-val-from-table test-conn
                                              {:rnum 196
                                               :column-name "c5"
                                               :table-name table-name}))))
          (is (= "[Broken]" (:c4 (get-val-from-table test-conn {:rnum 196
                                                                :column-name "c4"
                                                                :table-name table-name}))))
          (is (= 1 (:total (get-row-count test-conn {:table-name table-name})))))))))


(deftest ^:functional test-undo
  (let [dataset-id (import-file "GDP.csv" {:dataset-name "GDP Undo Test"})
        schedule (partial tf/schedule test-conn *transformation-engine* dataset-id)]
    (is (= 200 (:status (schedule {:type :undo}))))
    (let [{:keys [status body]} (do (schedule {:type :transformation
                                               :transformation {"op" "core/to-lowercase"
                                                                "args" {"columnName" "c1"}
                                                                "onError" "fail"}})
                                    (schedule {:type :transformation
                                               :transformation {"op" "core/change-datatype"
                                                                "args" {"columnName" "c5"
                                                                        "newType" "number"
                                                                        "defaultValue" 0}
                                                                "onError" "default-value"}})
                                    (schedule {:type :undo}))]
      (is (= 200 status))
      (is (= (:columns (dataset-version-by-dataset-id test-conn
                                                      {:dataset-id dataset-id :version 2}))
             (:columns (latest-dataset-version-by-dataset-id test-conn
                                                             {:dataset-id dataset-id}))))
      (let [table-name (:table-name
                        (latest-dataset-version-by-dataset-id test-conn
                                                              {:dataset-id dataset-id}))]
        (is (= "usa"
               (:c1 (get-val-from-table test-conn
                                        {:rnum 1
                                         :column-name "c1"
                                         :table-name table-name})))))
      (schedule {:type :undo})
      (let [table-name (:table-name
                        (latest-dataset-version-by-dataset-id test-conn
                                                              {:dataset-id dataset-id}))]
        (is (= "USA"
               (:c1 (get-val-from-table test-conn
                                        {:rnum 1
                                         :column-name "c1"
                                         :table-name table-name}))))))))

(deftest ^:functional combine-transformation-test
  (let [dataset-id (import-file "name.csv" {:has-column-headers? true})
        schedule (partial tf/schedule test-conn *transformation-engine* dataset-id)]
    (let [{:keys [status body]} (schedule {:type :transformation
                                           :transformation {"op" "core/combine"
                                                            "args" {"columnNames" ["c1" "c2"]
                                                                    "newColumnTitle" "full name"
                                                                    "separator" " "}
                                                            "onError" "fail"}})]
      (is (= 200 status))
      (let [table-name (:table-name
                        (latest-dataset-version-by-dataset-id test-conn
                                                              {:dataset-id dataset-id}))]
        (is (= "bob hope"
               (:c1c2 (get-val-from-table test-conn
                                          {:rnum 1
                                           :column-name "c1c2"
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
  (let [dataset-id (import-file "dates.csv" {:has-column-headers? true})
        schedule (partial tf/schedule test-conn *transformation-engine* dataset-id)]
    (let [{:keys [status body]} (do (schedule (date-transformation "c1" "YYYY"))
                                    (schedule (date-transformation "c2" "DD/MM/YYYY"))
                                    (schedule (date-transformation "c3" "YYYY-MM-DD")))]
      (is (= 200 status))
      (let [table-name (:table-name
                        (latest-dataset-version-by-dataset-id test-conn
                                                              {:dataset-id dataset-id}))
            first-date (:c1 (get-val-from-table test-conn
                                                {:rnum 1
                                                 :column-name "c1"
                                                 :table-name table-name}))
            second-date (:c2 (get-val-from-table test-conn
                                                 {:rnum 1
                                                  :column-name "c2"
                                                  :table-name table-name}))
            third-date (:c3 (get-val-from-table test-conn
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
                    (latest-dataset-version-by-dataset-id test-conn {:dataset-id dataset-id}))]
    (get-data test-conn {:table-name table-name})))

(deftest ^:functional derived-column-test
  (let [dataset-id (import-file "derived-column.csv" {:has-column-headers? true})
        schedule (partial tf/schedule test-conn *transformation-engine* dataset-id)]
    (do (schedule (change-datatype-transformation "c2"))
        (schedule (change-datatype-transformation "c3")))

    (testing "Import and initial transforms"
      (is (= (latest-data dataset-id)
             [{:rnum 1 :c1 "a" :c2 1 :c3 2}
              {:rnum 2 :c1 "b" :c2 3 :c3 nil}
              {:rnum 3 :c1 nil :c2 4 :c3 5}])))

    (testing "Basic text transform"
      (schedule (derive-column-transform {"args" {"code" "row['foo'].toUpperCase()"
                                                  "newColumnTitle" "Derived 1"
                                                  "newColumnType" "text"}
                                          "onError" "leave-empty"}))
      (is (= ["A" "B" nil] (map :d1 (latest-data dataset-id)))))

    (testing "Basic text transform with drop row on error"
      (schedule (derive-column-transform {"args" {"code" "row['foo'].replace('a', 'b')"
                                                  "newColumnTitle" "Derived 3"
                                                  "newColumnType" "text"}
                                          "onError" "delete-row"}))
      (is (= ["b" "b"] (map :d2 (latest-data dataset-id))))
      ;; Undo this so we have all the rows in the remaining tests
      (schedule {:type :undo}))

    (testing "Basic text transform with abort"
      (schedule (derive-column-transform {"args" {"code" "row['foo'].length"
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
      (schedule (derive-column-transform {"args" {"code" "row['foo'].toUpperCase()"
                                                  "newColumnType" "text"
                                                  "newColumnTitle" "Derived 4"}}))
      (is (= ["A" "B" nil] (map :d2 (latest-data dataset-id))))

      (schedule (derive-column-transform {"args" {"code" "row['Derived 4'].toLowerCase()"
                                                  "newColumnType" "text"
                                                  "newColumnTitle" "Derived 5"}}))
      (is (= ["a" "b" nil] (map :d3 (latest-data dataset-id)))))))
