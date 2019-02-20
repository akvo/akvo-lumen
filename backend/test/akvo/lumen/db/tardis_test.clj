(ns akvo.lumen.db.tardis-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*tenant-conn* tenant-conn-fixture system-fixture]]
            [clojure.string :as str]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql])
  (:import [org.postgresql.util PSQLException]))

(hugsql/def-db-fns "akvo/lumen/db/tardis_test.sql")

(use-fixtures :each system-fixture tenant-conn-fixture)

(deftest tardis-with-alter-table
  (testing "with current data in public schema table, we alter table definition. Functionality keeps the same"
    (is (= '() (get-data *tenant-conn* {:table-name "data_source"})))
    (is (= 1 (insert-data-source *tenant-conn* {})))
    (is (thrown-with-msg? PSQLException
                          #"column \"test\" of relation \"data_source\" does not exist"
                          (insert-altered-data-source *tenant-conn* {:table-name "data_source" })))
    (is (= 0 (alter-table-add-test-bool *tenant-conn* {:table-name "public.data_source"})))
    (is (= 0 (alter-table-add-test-bool *tenant-conn* {:table-name "history.data_source"})))
    (is (= 1 (insert-altered-data-source *tenant-conn* {:table-name "public.data_source" })))
    (is (= [nil true] (mapv :test (get-data *tenant-conn* {:table-name "data_source"}))))
    (is (= 2 (update-data-source-test *tenant-conn* {:test "true"})))
    (is (= [true true] (mapv :test (get-data *tenant-conn* {:table-name "data_source"}))))
    (is (= 2 (update-data-source-test *tenant-conn* {:test "false"})))
    (is (= [false false] (mapv :test (get-data *tenant-conn* {:table-name "data_source"}))))))
