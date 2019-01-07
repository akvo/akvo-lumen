(ns akvo.lumen.lib.update-test
  (:require [akvo.lumen.lib.update :as update]
            [clojure.test :refer :all]
            [clojure.string :as str]))

(deftest compatible-columns
  (let [imported-columns [{"sort" nil,
                           "type" "text",
                           "title" "A",
                           "hidden" false,
                           "direction" nil,
                           "columnName" "c1"}
                          {"sort" nil,
                           "type" "text",
                           "title" "B",
                           "hidden" false,
                           "direction" nil,
                           "columnName" "c2"}]
        columns '({:id "c1",
                   :title "A",
                   :type "text"}
                  {:id "c2",
                   :title "B",
                   :type "text"})]
    (testing "No changes to columns"
      (is (update/compatible-columns? imported-columns columns)))

    (testing "Changes to column title case"
      (let [columns (map #(update % :title str/lower-case)
                         columns)]
        (is (update/compatible-columns? imported-columns columns))))

    (testing "Changes to column title case"
      (let [columns (map (fn [column]
                           (update column :title #(str % "-new-part" )))
                         columns)]
        (is (update/compatible-columns? imported-columns columns))))

    (testing "Changes to column type"
      (let [columns (map #(assoc % :type "number")
                         columns)]
        (is (not (update/compatible-columns? imported-columns columns)))))

    (testing "New column"
      (let [columns (conj columns {:id :c3 :title "C" :type "text"})]
        (is (update/compatible-columns? imported-columns columns))))

    (testing "Removed column"
      (is (not (update/compatible-columns? imported-columns (pop columns)))))))
