(ns akvo.lumen.specs.import
  (:require [akvo.lumen.specs.import.values :as v]
            [akvo.lumen.util :refer (squuid)]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.string :as string]
            [clojure.tools.logging :as log])
  (:import [akvo.lumen.postgres Geoshape Geopoint]
           [java.time Instant]))

(create-ns  'akvo.lumen.specs.import.column)
(create-ns  'akvo.lumen.specs.import.column.text)
(create-ns  'akvo.lumen.specs.import.column.number)
(create-ns  'akvo.lumen.specs.import.column.date)
(create-ns  'akvo.lumen.specs.import.column.geoshape)
(create-ns  'akvo.lumen.specs.import.column.geopoint)
(create-ns  'akvo.lumen.specs.import.column.multiple)

(alias 'c 'akvo.lumen.specs.import.column)
(alias 'c.text 'akvo.lumen.specs.import.column.text)
(alias 'c.number 'akvo.lumen.specs.import.column.number)
(alias 'c.date 'akvo.lumen.specs.import.column.date)
(alias 'c.geoshape 'akvo.lumen.specs.import.column.geoshape)
(alias 'c.geopoint 'akvo.lumen.specs.import.column.geopoint)
(alias 'c.multiple 'akvo.lumen.specs.import.column.multiple)

(s/def ::c.text/type #{:text})
(s/def ::c.number/type #{:number})
(s/def ::c.date/type #{:date})
(s/def ::c.geoshape/type #{:geoshape})
(s/def ::c.geopoint/type #{:geopoint})
(s/def ::c.multiple/type #{:multiple})

(s/def ::c/type #{:text :number :date :geoshape :geopoint :multiple})

(s/def ::column (s/keys :req-un [::v/id ::v/title ::c/type] :opt-un [::v/key]))

(s/def ::c.text/header (s/keys :req-un [::v/id ::v/title ::c.text/type] :opt-un [::v/key]))
(s/def ::c.number/header (s/keys :req-un [::v/id ::v/title ::c.number/type]))
(s/def ::c.date/header (s/keys :req-un [::v/id ::v/title ::c.date/type]))
(s/def ::c.geoshape/header (s/keys :req-un [::v/id ::v/title ::c.geoshape/type]))
(s/def ::c.geopoint/header (s/keys :req-un [::v/id ::v/title ::c.geopoint/type]))
(s/def ::c.multiple/header (s/keys :req-un [::v/id ::v/title ::c.multiple/type ::v/multiple-type ::v/multiple-id]))

(defmulti column-header :type)
(defmethod column-header :text [_] ::c.text/header)
(defmethod column-header :date [_] ::c.date/header)
(defmethod column-header :number [_] ::c.number/header)
(defmethod column-header :geoshape [_] ::c.geoshape/header)
(defmethod column-header :geopoint [_] ::c.geopoint/header)
(defmethod column-header :multiple [_] ::c.multiple/header)

(s/def ::c/header (s/multi-spec column-header :type))

(s/def ::c.text/value string?)

(s/def ::c.number/value double?)

(s/def ::c.date/value (s/with-gen
                        #(instance? Instant %)
                        #(s/gen #{(Instant/parse "2017-12-03T10:15:30.00Z") (Instant/parse "2018-12-03T10:15:30.00Z")})))

(s/def ::c.multiple/value (s/with-gen
                            string?
                            #(s/gen #{v/cad1 v/cad2 v/cad3})))

(s/def ::c.geoshape/value (s/with-gen
                            (s/keys :req-un [::v/wkt-string])
                            #(s/gen #{(Geoshape. v/polygon) (Geoshape. v/multipolygon)})))

(s/def ::c.geopoint/value (s/with-gen
                            #(instance? Geopoint %)
                            #(s/gen #{(Geopoint. "auto-generated")})))

(defmulti column-body (fn[{:keys [type] :as o}] type))

(s/def ::c.text/body (s/keys :req-un [::c.text/type ::c.text/value]))
(s/def ::c.number/body (s/keys :req-un [::c.number/type ::c.number/value]))
(s/def ::c.date/body (s/keys :req-un [::c.date/type ::c.date/value]))
(s/def ::c.geoshape/body (s/keys :req-un [::c.geoshape/type ::c.geoshape/value]))
(s/def ::c.geopoint/body (s/keys :req-un [::c.geopoint/type ::c.geopoint/value]))

(defmethod column-body :text [_] ::c.text/body)
(defmethod column-body :number [_] ::c.number/body)
(defmethod column-body :date [_] ::c.date/body)
(defmethod column-body :geoshape [_] ::c.geoshape/body)
(defmethod column-body :geopoint [_] ::c.geopoint/body)

(s/def ::c/body  (s/multi-spec column-body (fn [a b] a)))

(defmulti column (fn[{:keys [header body]}] (:type header)))
(defmethod column :text [_]
  (s/keys :req-un [::c.text/header ::c.text/body]))
(defmethod column :number [_]
  (s/keys :req-un [::c.number/header ::c.number/body]))
(defmethod column :date [_]
  (s/keys :req-un [::c.date/header ::c.date/body]))
(defmethod column :geoshape [_]
  (s/keys :req-un [::c.geoshape/header ::c.geoshape/body]))
(defmethod column :geopoint [_]
  (s/keys :req-un [::c.geopoint/header ::c.geopoint/body]))

(s/def :import/column (s/multi-spec column (fn [a b] a)))

(defn- keyname [key] (str (namespace key) "/" (name key)))

(defn sample-with-gen [s map-gen amount]
  (map first (s/exercise s amount map-gen)))

(defn sample [s amount]
  (map first (s/exercise s amount)))

(defn sample-imported-dataset [types-gens-tuple rows-count]
  (let [adapt-spec (fn [k] (-> k keyname (string/replace "/body" "/value" ) keyword))
        kw->spec (fn [s h] (->> (name h) (format s) keyword))
        kw->column-spec (fn [h] (kw->spec "akvo.lumen.specs.import.column.%s/header" h))
        kw->body-spec (fn [h] (kw->spec "akvo.lumen.specs.import.column.%s/body" h))
        header-types (map (fn [t] (if (sequential? t) (first t) t)) types-gens-tuple)
        headers   (map kw->column-spec header-types)
        columns   (->> (map (fn [t]
                              (if (sequential? t)
                                (sample (kw->column-spec (first t)) 1)
                                (sample (kw->column-spec t) 1))) types-gens-tuple)
                       (mapv #(assoc (first %2)
                                     :id (str "c" %)
                                     :title (str "Column" (inc %)))
                             (range (count headers))))
        _         (do
                    "ensure columns headers are valid specs"
                    (reduce #(assert (s/valid? ::c/header %2) %) [] columns))
        row-types (map (fn [t]
                         (let [t (if (sequential? t) (first t) t)]
                           (kw->body-spec t))) types-gens-tuple)
        rows0     (reduce (fn [c _] (conj c (mapv (fn [t tg]
                                                    (last (if (sequential? tg)
                                                            (sample-with-gen t {(adapt-spec t) (last tg)}  10)
                                                            (sample t 10)))) row-types types-gens-tuple)))
                          [] (range rows-count))
        _         (do
                    "ensure column bodies (cells) are valid specs"
                    (reduce #(assert (s/valid? ::c/body %2) %) [] (flatten rows0)))
        rows      (mapv #(mapv (fn [c] (dissoc c :type)) %) rows0)]
    {:columns columns :rows rows}))
