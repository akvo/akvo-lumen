(ns akvo.lumen.specs.import
  (:require [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.util :as u]
            [akvo.lumen.specs.import.column :as c]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(defn sample-imported-dataset [types-gens-tuple rows-count]
  (let [adapt-spec (fn [k] (-> k lumen.s/keyname (string/replace "/body" "/value" ) keyword))
        kw->spec (fn [s h] (->> (name h) (format s) keyword))
        kw->column-spec (fn [h] (kw->spec "akvo.lumen.specs.import.column.%s/header" h))
        kw->body-spec (fn [h] (kw->spec "akvo.lumen.specs.import.column.%s/body" h))
        header-types (map (fn [t] (if (sequential? t) (first t) t)) types-gens-tuple)
        headers   (map kw->column-spec header-types)
        columns   (->> (map (fn [t]
                              (if (sequential? t)
                                (lumen.s/sample-with-gen (kw->column-spec (first t)) (if (map? (last t))
                                                                                         (last t)
                                                                                         {(adapt-spec (first t)) (last t)})  1)
                                (list (lumen.s/sample (kw->column-spec t) 1)))) types-gens-tuple)
                       (mapv #(assoc (first %2)
                                     :id (str "c" (inc %))
                                     :title (str "Column" (inc %)))
                             (range (count headers))))
        _         (do
                    ;; "ensure columns headers are valid specs"
                    (reduce (fn [_ i] (u/conform ::c/header i)) [] columns))
        row-types (map (fn [t]
                         (let [t (if (sequential? t) (first t) t)]
                           (kw->body-spec t))) types-gens-tuple)
        rows0     (reduce (fn [c _] (conj c (mapv (fn [t tg]
                                                    (last (if (sequential? tg)
                                                            (lumen.s/sample-with-gen t
                                                                                     (if (map? (last tg))
                                                                                         (last tg)
                                                                                         {(adapt-spec t) (last tg)})  10)
                                                            (lumen.s/sample t 10)))) row-types types-gens-tuple)))
                          [] (range rows-count))
        _         (do
                   ;;  "ensure column bodies (cells) are valid specs"
                    (reduce (fn [_ i] (u/conform ::c/body i)) [] (flatten rows0)))
        rows      (mapv #(mapv (fn [c] (dissoc c :type)) %) rows0)]
    {:columns columns :rows rows}))
