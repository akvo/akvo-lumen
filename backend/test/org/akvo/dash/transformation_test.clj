(ns org.akvo.dash.transformation-test
  (:require
   [clojure.data :refer [diff]]
   [clojure.data.csv :as csv]
   [clojure.java.io :as io]
   [clojure.test :refer :all]
   [org.akvo.dash.transformation :as tf]))


(def people
  "Test data"
  (csv/read-csv (slurp (io/resource "org/akvo/dash/test/people.csv"))))


(deftest parse-csv-with-header-test
  (testing "CSV import."
    (is (->> (diff (tf/parse-csv-with-headers people)
                   [{:title  "Name"
                     :type   "STRING"
                     :values ["Bob" "Stella" "Sam" "Jane"]}
                    {:title  "Age"
                     :type   "STRING"
                     :values ["44" "53" "20" "27"]}
                    {:title  "Sex"
                     :type   "STRING"
                     :values ["M" "F" "M" "F"]}
                    {:title  "Location"
                     :type   "STRING"
                     :values ["Scottland" "Australia" "Canada" "France"]}])
             (map nil?)
             butlast
             (every? true?)))))


(deftest parse-csv-without-header-test
  (testing "CSV import of file without header."

    (is (->> (diff (tf/parse-csv-without-headers (rest people))
                   [{:title  "1"
                     :type   "STRING"
                     :values ["Bob" "Stella" "Sam" "Jane"]}
                    {:title  "2"
                     :type   "STRING"
                     :values ["44" "53" "20" "27"]}
                    {:title  "3"
                     :type   "STRING"
                     :values ["M" "F" "M" "F"]}
                    {:title  "4"
                     :type   "STRING"
                     :values ["Scottland" "Australia" "Canada" "France"]}])
             (map nil?)
             butlast
             (every? true?)))))


(deftest update-column-header-test
  (let [data {:columns (tf/parse-csv-without-headers (rest people))}]

    (testing "Update column header"
      (is (= "Column 1"
             (->>  (filter #(= (:title %) "Column 1")
                           (:columns (tf/update-column-header data
                                                              "1"
                                                              "Column 1")))
                   first
                   :title))))))


(deftest update-column-type-description-test
  (let [data {:columns (tf/parse-csv-with-headers people)}]

    (testing "Change column type to NUMBER"
      (is (= "NUMBER"
             (->> (filter #(= (:title %) "Age")
                          (:columns (tf/update-column-type-description data
                                                                       "Age"
                                                                       "NUMBER")))
                  first
                  :type))))))


(deftest cast-column-values-test
  (let [data {:columns (tf/parse-csv-with-headers people)}]

    (testing "Change column values to number"
      (is (= true
             (->> (filter #(= (:title %) "Age")
                          (:columns (tf/cast-column-values data
                                                           "Age"
                                                           "NUMBER"
                                                           read-string)))
                  first
                  :values
                  (map number?)
                  (every? true?)))))))
