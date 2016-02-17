(ns org.akvo.dash.transformation
  (:require
   [clojure.data.csv :as csv]
   [clojure.java.io :as io]
   [clojure.pprint :refer [pprint]]
   [traversy.lens :as l]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Parse CSV

;; https://www.refheap.com/114736 - Jonas?
;;
;; (let [data  '(["Name" "Age" "Gender"]
;;               ["John"  "35" "M"]
;;               ["Maria" "2" "F"]
;;               ["Pedro" "30" "M"]
;;               ["Jose" "40" "M"])
;;       tdata (apply mapv vector data)] ;; transpose data
;;   (mapv (fn [r]
;;           {"title"  (first r)
;;            "values" (rest r)
;;            "type"   "STRING"}) tdata))

(defn parse-csv-with-headers
  "Transforms CSV like format to a shape that is closer to our JSON
  representaion.
  [[header1 header2]
   [foo bar]]
  into
  [[header1 foo]
   [header2 bar]]"
  [data]
  (mapv (fn [r] ;; We feed in a row and get a column back.
          {:title  (first r)
           :type   "STRING"
           :values (rest r)})
        (apply mapv vector data))) ;; transpose data


(defn parse-csv-without-headers
  "Add a header row with strings of number & call parse-csv-with-headers"
  [data]
  (let [n       (inc (count (first data)))
        headers (vec (map str (range 1 n)))]
    (parse-csv-with-headers (vec (cons headers
                                       data)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Column header

(defn update-column-header
  ""
  [data old-header new-header]
  (-> data
      (l/update (l/*> (l/in [:columns])
                  l/each
                  (l/conditionally #(= old-header (get % :title))))
              #(assoc % :title new-header))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Column type

(defn update-column-type-description
  "Update column type to new-type on column with columns-title."
  [data column-title new-type]
  (-> data
      (l/update (l/*> (l/in [:columns])
                  l/each
                  (l/conditionally #(= column-title (get % :title))))
              #(assoc % :type new-type))))


(defn cast-column-values
  "Update column type to new-type on column with columns-title."
  [data column-title new-type cast-fn]
  (-> data
      (l/update (l/*> (l/in [:columns])
                  l/each
                  (l/conditionally #(= column-title (get % :title)))
                  (l/in [:values]))
              #(map cast-fn %))))


(defn cast-column
  "Cast column with title to new type. Where type is one of:
  [\"NUMBER\"]
  cast-fn is a function that will parse the current value, e.i. for string to
  number this read-string would be a good candidate."
  [data title new-type cast-fn]
  (-> data
      (update-column-type-description title
                                      new-type)
      (cast-column-values title
                          new-type
                          cast-fn)))

;; (cast-column "1" "NUMBER" read-string)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Coerce by guess?

(defn guess-cast
  "Can we pass in data an try and coerce data? At least it should be possible
  for number

  Is it a good idea to alter data that way? Maybe something that the user should
  add as a transformations?"
  [data]
  data)



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Old


;;; https://rosettacode.org/wiki/Determine_if_a_string_is_numeric#Clojure
(defn numeric? [s]
  (if-let [s (seq s)]
    (let [s (if (= (first s) \-) (next s) s)
          s (drop-while #(Character/isDigit %) s)
          s (if (= (first s) \.) (next s) s)
          s (drop-while #(Character/isDigit %) s)]
      (empty? s))))

;; Sure you want an int? Number, bigint?
(defn parse-int [s]
  (Integer. (re-find  #"\d+" s)))


;; (defn column
;;   "Takes a row and make it a column."
;;   [row]
;;   (merge {"title" (first row)}
;;          (cond
;;            (number? (second row)) {"type"   "NUMBER"
;;                                    "values" (rest row)}
;;            (numeric? (second row)) {"type"   "NUMBER"
;;                                     "values" (map read-string (rest row))}
;;            :else {"type"   "STRING"
;;                   "values" (rest row)})))


;; (def people
;;   (csv/read-csv (slurp (io/resource "org/akvo/dash/test/people.csv")) ))

;; (def people
;;   (csv/read-csv (slurp (io/resource "org/akvo/dash/test/FL_insurance_sample.csv")) ))


;; (-> [{:title "Name"} {:title "Age"}]
;;     (view (combine (*> each)
;;                    (conditionally #(= "Age" (:title %)))
;;                    )))

;; (-> [{:title "Name"} {:title "Age"}]
;;     (update (combine (*> each)
;;                    (conditionally #(= "Age" (:title %))))
;;             #(assoc % :type "STRING")))

;; (-> [{:title "Name" :type "STRING"} {:title "Age" :type "STRING"}]
;;     (update (combine (*> each)
;;                      (conditionally #(= "Age" (:title %))))
;;             #(assoc % :type "NUMBER")))

;; (pprint
;;  (-> {:columns [{:title "Name" :type "STRING"} {:title "Age" :type "STRING"}]}
;;      (update (*> (in [:columns])
;;                  each
;;                  (conditionally #(= "Age" (get % :title ))))
;;              #(assoc % :type "NUMBER"))))

;; (pprint
;;  (-> {:columns [{"title" "Name" "type" "STRING"} {"title" "Age" "type" "STRING"}]}
;;      (update (*> (in [:columns])
;;                  each
;;                  (conditionally #(= "Age" (get % "title"))))
;;              #(assoc % "type" "NUMBER"))))

;; (defn update-column-type
;;   "Update column type to new-type on column with columns-title."
;;   [data column-title new-type]
;;   (-> data
;;       (update (*> (in [:columns])
;;                   each
;;                   (conditionally #(= column-title (get % :title))))
;;               #(assoc % column-title column-type))))

;; (update-column-type
;;  {:columns [{:title "Name" :type "STRING"} {:title "Age" :type "STRING"}]}
;;  "Age"
;;  "NUMBER"
;;  )


;; (defn coerce-column-view
;;   ""
;;   [data column-title type]
;;   (-> data
;;      (view (*> (in [:columns])
;;                each
;;                (conditionally #(= column-title (get % :title)))
;;                (in [:values])))))


;; (defn coerce-column
;;   ""
;;   [data column-title type]
;;   (-> data
;;       (update (*> (in [:columns])
;;                 each
;;                 (conditionally #(= column-title (get % :title)))
;;                 (in [:values]))
;;               #(map read-string %))))

;; (pprint
;;  (coerce-column
;;   {:columns [{:title "Name" :type "STRING" :values ["1" "2" "3"]}
;;              {:title "Age" :type "STRING" :values ["1" "2" "3"]}]}
;;   "Age"
;;   "NUMBER"))




;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Playing with traversy lenses
