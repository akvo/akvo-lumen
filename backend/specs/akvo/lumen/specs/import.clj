(ns akvo.lumen.specs.import
  (:require [akvo.lumen.specs :as lumen.s]
            [akvo.lumen.util :as u]
            [akvo.lumen.specs.import.column :as c]
            [clojure.spec.alpha :as s]
            [clojure.spec.gen.alpha :as gen]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(defn csv-sample-imported-dataset
  "a csv dataset"
  ([types-gens-tuple rows-count]
   (csv-sample-imported-dataset types-gens-tuple rows-count true))
  ([types-gens-tuple rows-count columns-no-keys?]
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
                              (range (count headers)))
                        (mapv #(if columns-no-keys?
                                 (dissoc % :key)
                                 %)))
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
     {:columns (mapv #(dissoc % :groupId :groupName) columns) :rows rows})))

(def ^:private metadata-columns [{:title "Identifier",
                                  :type "text",
                                  :id :identifier,
                                  :groupName "metadata",
                                  :groupId "metadata",
                                  :repeatable false}
                                 {:title "Instance id",
                                  :type "text",
                                  :id :instance_id,
                                  :key true,
                                  :groupName "metadata",
                                  :groupId "metadata",
                                  :repeatable false}
                                 {:title "Display name",
                                  :type "text",
                                  :id :display_name,
                                  :groupName "metadata",
                                  :groupId "metadata",
                                  :repeatable false}
                                 {:title "Submitter",
                                  :type "text",
                                  :id :submitter,
                                  :groupName "metadata",
                                  :groupId "metadata",
                                  :repeatable false}
                                 {:title "Submitted at",
                                  :type "date",
                                  :id :submitted_at,
                                  :groupName "metadata",
                                  :groupId "metadata",
                                  :repeatable false}
                                 {:title "Surveyal time",
                                  :type "number",
                                  :id :surveyal_time,
                                  :groupName "metadata",
                                  :groupId "metadata",
                                  :repeatable false}
                                 {:title "Device Id",
                                  :type "text",
                                  :id :device_id,
                                  :groupName "metadata",
                                  :groupId "metadata"}])

(defn- sample-column-values
  [columns instance-id]
  (-> (reduce (fn [x column] (assoc x (:id column) (:value (lumen.s/sample (c/column-body {:type (:type column)}))))) {} columns)
      (assoc :instance_id instance-id)))

(defn flow-sample-imported-dataset
  " `groups` example shape
  [{:groupId \"groupId2\"
    :groupName \"groupName1\"
    :repeatable true
    :column-types [\"option\" \"text\"]
    :max-responses 10}
   {:groupId \"groupId2\"
    :groupName \"groupName2\"
    :repeatable false
    :column-types [\"number\" \"date\"]}]"
  [groups submissions]
  (let [max-responses    (reduce (fn [c {:keys [groupId max-responses]}]
                                   (assoc c groupId (or max-responses 1))
                                   ) {} groups)
        repeatables      (reduce (fn [c {:keys [groupId repeatable]}]
                                   (assoc c groupId (boolean repeatable))
                                   ) {} groups)
        instance-ids     (map #(str (+ % 1000)) (range submissions))
        group-columns    (->> (map (fn [group]
                                     (let [group-details (select-keys group [:groupId :groupName :repeatable])]
                                       (map (fn [column-type]
                                              (let [header-spec (c/column-header {:type column-type})]
                                                (lumen.s/sample-with-gen-v2 header-spec
                                                                            {:akvo.lumen.specc/type #(s/gen #{column-type})}
                                                                            (assoc group-details :key false))))
                                            (:column-types group))))
                                   groups)
                              flatten
                              (map #(assoc %2 :id (str "c" (inc %))) (range)))
        group-columns-v4 (reduce (fn [c group]
                                   (let [group-details (select-keys group [:groupId :groupName :repeatable])]
                                     (conj c (merge {:title  "Instance id",
                                                     :type   "text",
                                                     :id     "instance_id",
                                                     :key    false,
                                                     :hidden true} group-details))))
                                 group-columns groups)
        data             (group-by :groupId group-columns)
        rows             (map (fn [instance-id]
                                (reduce (fn [c [groupId columns]]
                                          (let [r (if (get repeatables groupId)
                                                        (let [x (rand-int (get max-responses groupId))]
                                                          (if (> x 0) x 1))
                                                        1)]
                                            (assoc c groupId (mapv (fn [_] (sample-column-values columns instance-id))
                                                                   (range r))))
                                          ) {"metadata" [(sample-column-values metadata-columns instance-id)]} data))
                              instance-ids)]
    {:columns-v4 (vec (apply conj group-columns-v4 metadata-columns))
     :columns-v3 (vec  (apply conj group-columns metadata-columns))
     :records-v3 (mapv (fn [form-instance]
                         (let [metadata (first (get form-instance "metadata"))
                               groups   (reduce (fn [c [g responses]]
                                                  (with-meta
                                                    (merge c (dissoc (first responses) :instance_id))
                                                    {:ns "main"})) {} (dissoc form-instance "metadata"))]
                           [metadata groups])) rows)
     :records-v4 (vec rows)}))
