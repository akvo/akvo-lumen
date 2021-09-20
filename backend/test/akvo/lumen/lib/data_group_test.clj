(ns akvo.lumen.lib.data-group-test
  (:require [akvo.lumen.lib.data-group :as data-group]
            [clojure.test :refer [deftest is]]))

(def test-data-groups [{:columns [{:columnName "instance_id"}
                                  {:columnName "rnum"}
                                  {:columnName "identifier"}
                                  {:columnName "A"}]
                        :group-id "metadata"
                        :table-name "ds_meta"}
                       {:columns [{:columnName "instance_id"}
                                  {:columnName "rnum"}
                                  {:columnName "B"}]
                        :group-id "repeated"
                        :table-name "ds_repeated"}
                       {:group-id "not-repeated"
                        :columns [{:columnName "instance_id"}
                                  {:columnName "rnum"}
                                  {:columnName "C"}]
                        :table-name "ds_not_repeated"}])


(def test-data-groups-template {:select ["instance_id" "rnum" "identifier" "A" "B" "C"]
                                :from {:metadata "ds_meta"
                                       :others ["ds_repeated" "ds_not_repeated"]}})

(def csv-data-groups [{:columns [{:columnName "c1"}]
                       :group-id "main"
                       :table-name "ds_main"}])

(def csv-data-groups-template {:select ["c1"]
                               :from {:metadata nil
                                      :others ["ds_main"]}})

(deftest ^:unit generate-data-groups-template-sql
  (is (= test-data-groups-template (data-group/data-groups-sql-template test-data-groups)))
  (is (= csv-data-groups-template (data-group/data-groups-sql-template csv-data-groups))))

(deftest ^:unit generate-data-groups-sql
  (let [flow-sql "SELECT m.instance_id, rnum, identifier, A, B, C FROM ds_meta m LEFT JOIN ds_repeated ON m.instance_id = ds_repeated.instance_id LEFT JOIN ds_not_repeated ON m.instance_id = ds_not_repeated.instance_id"
        csv-sql "SELECT c1 FROM ds_main"]
    (is (= flow-sql (data-group/data-groups-sql test-data-groups-template)))
    (is (= csv-sql (data-group/data-groups-sql csv-data-groups-template)))))

(deftest ^:unit data-groups-view
  (let [expected "CREATE TEMP VIEW foo AS SELECT * FROM bar"]
    (is (= expected (data-group/data-groups-view "foo" true false "SELECT * FROM bar ")))))
