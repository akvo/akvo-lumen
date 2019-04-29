(ns akvo.lumen.lib.update-test
  (:require [akvo.lumen.lib.update :as update]
            [clojure.test :refer :all]
            [clojure.data :as d]
            [clojure.string :as str]))

(deftest compatible-columns-errors
  (let [dict {"c1" "year", "c2" "dd/mm/yyyy", "c3" "yyyy-mm-dd", "c4" "name"}]
    (let [imported-columns [{:id "c1", :type "number"} {:id "c2", :type "text"} {:id "c3", :type "text"} {:id "c4", :type "text"}]
          columns [{:id "c1", :type "text"} {:id "c2", :type "text"} {:id "c3", :type "text"} {:id "c4", :type "number"}]]
      (is (= (:wrong-types (update/compatible-columns-errors dict imported-columns columns))
             [{:title "year",
	       :id "c1",
	       :imported-type "number",
	       :updated-type "text"}
	      {:title "name",
	       :id "c4",
	       :imported-type "text",
	       :updated-type "number"}])))

    (let [imported-columns [{:id "c1", :type "number"} {:id "c2", :type "text"} {:id "c3", :type "text"} {:id "c4", :type "text"}]
          columns [{:id "c1", :type "text"} {:id "c2", :type "text"} {:id "c3", :type "text"}]]
      (is (= [{:title "name", :id "c4"}]
             (:columns-missed (update/compatible-columns-errors dict imported-columns columns)))))))

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
      (is (nil? (update/compatible-columns-error? imported-columns columns))))

    (testing "Changes to column title case"
      (let [columns (map #(update % :title str/lower-case)
                         columns)]
        (is (nil? (update/compatible-columns-error? imported-columns columns)))))

    (testing "Changes to column title case"
      (let [columns (map (fn [column]
                           (update column :title #(str % "-new-part" )))
                         columns)]
        (is (nil? (update/compatible-columns-error? imported-columns columns)))))

    (testing "Changes to column type"
      (let [columns (map #(assoc % :type "number")
                         columns)]
        (is (some? (update/compatible-columns-error? imported-columns columns)))))

    (testing "New column"
      (let [columns (conj columns {:id :c3 :title "C" :type "text"})]
        (is (nil? (update/compatible-columns-error? imported-columns columns)))))

    (testing "Removed column"
      (is (some? (update/compatible-columns-error? imported-columns (pop columns)))))))
