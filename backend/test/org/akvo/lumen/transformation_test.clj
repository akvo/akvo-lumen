(ns org.akvo.lumen.transformation-test
  (:require [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.test :refer :all]
            [com.stuartsierra.component :as component]
            [duct.component.hikaricp :refer [hikaricp]]
            [hugsql.core :as hugsql]
            [org.akvo.lumen.component.tenant-manager :refer [tenant-manager]]
            [org.akvo.lumen.component.transformation-engine :refer [transformation-engine]]
            [org.akvo.lumen.fixtures :refer (test-conn
                                             test-tenant-spec
                                             migrate-tenant
                                             rollback-tenant)]
            [org.akvo.lumen.import :as imp]
            [org.akvo.lumen.transformation :as tf]
            [org.akvo.lumen.util :refer (squuid)]))

(def ops (vec (json/parse-string (slurp (io/resource "ops.json")))))
(def invalid-op (-> (take 3 ops)
                    vec
                    (update-in [1 "args"] dissoc "parseFormat")))


(hugsql/def-db-fns "org/akvo/lumen/job-execution.sql")
(hugsql/def-db-fns "org/akvo/lumen/transformation_test.sql")
(hugsql/def-db-fns "org/akvo/lumen/transformation.sql")

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


(defn import-file
  "Import a file and return the dataset-id"
  [file {:keys [dataset-name has-column-headers?]}]
  (let [data-source-id (str (squuid))
        job-id (str (squuid))
        data-source-spec {"name" (or dataset-name file)
                          "source" {"path" (.getAbsolutePath (io/file (io/resource file)))
                                    "kind" "DATA_FILE"
                                    "fileName" (or dataset-name file)
                                    "hascolumnheaders" (boolean has-column-headers?)}}]
    (insert-data-source test-conn {:id data-source-id :spec data-source-spec})
    (insert-job-execution test-conn {:id job-id :data-source-id data-source-id})
    (imp/do-import test-conn {:file-upload-path "/tmp/akvo/dash"} job-id)
    (:dataset_id (dataset-id-by-job-execution-id test-conn {:id job-id}))))

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
