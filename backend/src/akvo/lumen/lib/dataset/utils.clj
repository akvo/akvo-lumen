(ns akvo.lumen.lib.dataset.utils
  (:require [clojure.string :as str])
  (:import [java.time Instant]))

(defn find-column
  ([columns v]
   (find-column columns v :columnName))
  ([columns v filter-by]
   (when v
     (if-let [column (first (filter #(= v (filter-by %)) columns))]
       column
       (throw (ex-info (str "No such column: " v) {filter-by v}))))))

(defn from-clause [table-names]
  (format "%s %s" (first table-names)
          (let [f (first table-names)
                r (rest table-names)]
            (str/join " "
                      (map #(format " JOIN %s ON %s.rnum=%s.rnum" % f %) r)))))

(defn unify-transformation-history [dataset-versions]
  (if (= 1 (count dataset-versions))
    (->> dataset-versions
         (map :transformations)
         (reduce into []))
    (->> dataset-versions
         (map :transformations)
         (reduce into [])
         (sort-by #(get % "created") #(compare (Instant/parse %1) (Instant/parse %2))))))

(defn- find-table-name-by-ns [ds-versions namespace]
  (:table-name (first (filter #(= (:namespace %) namespace) ds-versions))))

(defn find-table-name-by-column [ds-versions column]
  (find-table-name-by-ns ds-versions (:namespace column "main")))

