(ns org.akvo.dash.tardis-test
  (:require
    [akvo.commons.psql-util :refer [pgobj->val]]
    [cheshire.core :as json]
    [clj-time.core :as time]
    [clj-time.coerce :as coerce]
    [clojure.test :refer :all]
    [hugsql.core :as hugsql]
    [org.akvo.dash.fixtures :refer [system-fixture]]
    [user :refer [config]]))

(hugsql/def-db-fns "org/akvo/dash/tardis_test.sql")

(use-fixtures :once system-fixture)

(def conn {:connection-uri (-> config :db :uri)})

(defn sql-now[]
  "Returns now in sql time formate"
  (coerce/to-sql-time (time/now)))

(defn for-all-tenants
  "Execute a function that takes a db uri as param for all tenants"
  [f]
  (doseq [tenant (all-tenants conn)]
    (f (:db_uri tenant))))

(deftest ^:functional tardis-testing

  (testing "Tardis"
    (let [dataset {:id              "12345"
                   :title           "The dataset"
                   :description     "A dataset"
                   :transaction_log (json/generate-string "log entry")}]

      (testing "insert"
        (defn test-insert
          [db_uri]
          (insert-dataset db_uri dataset)
          (is (=
                1
                ((count-history-dataset-by-ts db_uri {:now (sql-now)}) :count))))
        (for-all-tenants test-insert))

      (testing "update"
        (defn test-update
          [db_uri]
          (let [new-log-entry {:transaction_log (json/generate-string "new log entry")}]
            (update-dataset db_uri (merge dataset new-log-entry))
            (is (=
                  1
                  ((count-history-dataset-by-ts db_uri {:now (sql-now)}) :count)))
            (is (=
                  (history-dataset-by-ts db_uri {:now (sql-now)})
                  (history-dataset-by-transaction-log db_uri new-log-entry)))
            (is (=
                  2
                  ((count-all-history-datasets db_uri ) :count)))))
        (for-all-tenants test-update))

      (testing "delete"
        (defn test-delete
          [db_uri]
          (delete-dataset-by-id db_uri dataset)
          (is (=
                0
                ((count-history-dataset-by-ts db_uri {:now (sql-now)}) :count)))
          (is (=
                2
                ((count-all-history-datasets db_uri ) :count))))
        (for-all-tenants test-delete))
      )))
