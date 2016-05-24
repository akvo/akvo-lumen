(ns org.akvo.dash.transformation.engine-test
  (:require [clojure.test :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.migrate :as migrate]
            [reloaded.repl :refer [system stop go]]
            [org.akvo.dash.transformation.engine :refer :all]
            [user :refer [config]]))

(hugsql/def-db-fns "org/akvo/dash/transformation/engine_test.sql")

(def tenant-conn {:connection-uri "jdbc:postgresql://localhost/test_dash_tenant_1?user=dash&password=password"})

(defn transformation-fixture
  [f]
  (migrate/do-migrate "org/akvo/dash/migrations_tenants" tenant-conn)
  (db-test-table tenant-conn)
  (db-test-data tenant-conn)
  (f)
  (db-drop-test-table tenant-conn)
  ;;(migrate/rollback tenant-conn :all)
  )

(use-fixtures :once transformation-fixture)

(def ops [{"op" "core/to-titlecase"
           "args" {"columnName" "c1"}
           "onError" "default-value"}])

(deftest ^:functional test-transformations
  (testing "valid data"
    (is (= {:success? true :dv {}}
           (apply-operation tenant-conn "ds_test_1" {} (first ops))))))
