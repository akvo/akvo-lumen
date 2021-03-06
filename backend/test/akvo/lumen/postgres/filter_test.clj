(ns akvo.lumen.postgres.filter-test
  (:require [akvo.lumen.postgres.filter :as f]
            [clojure.test :refer :all]))

(def columns
  '({:groupId nil,
     :key false,
     :groupName nil,
     :type "number",
     :title "id",
     :multipleId nil,
     :hidden false,
     :multipleType nil,
     :columnName "c1",
     :direction nil,
     :sort nil}
    {:groupId nil,
     :key false,
     :groupName nil,
     :type "text",
     :title "name",
     :multipleId nil,
     :hidden false,
     :multipleType nil,
     :columnName "c2",
     :direction nil,
     :sort nil}
    {:groupId nil,
     :key false,
     :groupName nil,
     :type "text",
     :title "country",
     :multipleId nil,
     :hidden false,
     :multipleType nil,
     :columnName "c3",
     :direction nil,
     :sort nil}
    {:groupId nil,
     :key false,
     :groupName nil,
     :type "text",
     :title "part",
     :multipleId nil,
     :hidden false,
     :multipleType nil,
     :columnName "c4",
     :direction nil,
     :sort nil}
    {:groupId nil,
     :key false,
     :groupName nil,
     :type "text",
     :title "city",
     :multipleId nil,
     :hidden false,
     :multipleType nil,
     :columnName "c5",
     :direction nil,
     :sort nil}
    {:groupId nil,
     :key false,
     :groupName nil,
     :type "number",
     :title "lat",
     :multipleId nil,
     :hidden false,
     :multipleType nil,
     :columnName "c6",
     :direction nil,
     :sort nil}
    {:groupId nil,
     :key false,
     :groupName nil,
     :type "number",
     :title "lng",
     :multipleId nil,
     :hidden false,
     :multipleType nil,
     :columnName "c7",
     :direction nil,
     :sort nil}
    {:groupId nil,
     :key false,
     :groupName nil,
     :type "option",
     :title "my option",
     :multipleId nil,
     :hidden false,
     :multipleType nil,
     :columnName "c8",
     :direction nil,
     :sort nil}
    {:sort nil,
     :type "geopoint",
     :title "Location",
     :hidden false,
     :direction nil,
     :columnName "d1"}))

(deftest ^:unit sql-str
  (testing "filter value not nil"
    (let [filters [{:value "South",
                    :column "c4",
                    :strategy "is",
                    :operation "keep",
                    :columnType "text"}
                   {:column "c3",
                    :strategy "is",
                    :operation "keep",
                    :columnType "text",
                    :value "Sweden"}]]
      (is (= "(coalesce(c4, '') = 'South') AND (coalesce(c3, '') = 'Sweden')"
             (f/sql-str columns filters)))))
  (testing "filter value nil"
    (let [filters [{:value "South",
                    :column "c4",
                    :strategy "is",
                    :operation "keep",
                    :columnType "text"}
                   {:column "c3",
                    :strategy "is",
                    :operation "keep",
                    :columnType "text",
                    :value nil}]
          r (f/sql-str columns filters)]
      (is (= "(coalesce(c4, '') = 'South') AND (coalesce(c3, '') = 'null')"
             r) )))
  (testing "filter option val"
    (let [base-filter {:value "wow",
                       :column "c8",
                       :operation "keep",
                       :columnType "option"}]
     (let [filters [(assoc base-filter :strategy "is")]
           r (f/sql-str columns filters)]
       (is (= "(coalesce(c8, '') = 'wow')" r)))
     (let [filters [(assoc base-filter :strategy "contains")]
           r (f/sql-str columns filters)]
       (is (= "(position('wow' in c8) > 0)" r)))
     (let [filters [(assoc base-filter :strategy "not_contains")]
           r (f/sql-str columns filters)]
       (is (= "(position('wow' in c8) = 0)" r)))
     (let [filters [(assoc base-filter :strategy "is" :operation "isEmpty" :value "yay")]
           r (f/sql-str columns filters)]
       (is (= "(coalesce(c8, '') <> 'yay')" r))))))
