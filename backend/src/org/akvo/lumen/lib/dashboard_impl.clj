(ns org.akvo.lumen.lib.dashboard-impl
  (:require
   [hugsql.core :as hugsql]
   [org.akvo.lumen.util :refer [squuid]]
   ))


(hugsql/def-db-fns "org/akvo/lumen/endpoint/dashboard.sql")


(defn dashboard-keys-match?
  "Make sure each key in entity have a matching key in layout."
  [dashboard]
  (= (keys (get dashboard "entities"))
     (keys (get dashboard "layout"))))

(defn filter-type
  [dashboard-data kind]
  (let [entities (filter #(= kind (get % "type"))
                                       (vals (get dashboard-data "entities")))
        ks     (set (map #(get % "id") entities))]
    {:entities entities
     :layout   (keep #(if (ks (get % "i")) %)
                     (vals (get dashboard-data "layout")))}))

(defn part-by-entity-type [entities]
  {:visualisations (filter-type entities "visualisation")
   :texts          (filter-type entities "text")})

(defn all-entities
  "Merge text & dashboard_visualisations (dvs) entries, return an id keyed map"
  [text-entities dvs]
  (let [entries (reduce conj text-entities (map (fn [dv]
                                                  {"id"   (:visualisation_id dv)
                                                   "type" "visualisation"}) dvs ))]
    (zipmap (map #(get % "id") entries)
            entries)))

(defn all-layouts
  "Merge text & dashboard_visualisations (dvs) layouts, return an id keyed map."
  [text-layout dvs]
  (let [layouts (reduce conj text-layout (map (fn [dv]
                                                (:layout dv))
                                              dvs))]
    (zipmap (map #(get % "i") layouts)
            layouts)))

(defn build-dashboard-by-id
  ""
  [dashboard dvs]
  (assoc (select-keys dashboard [:id :title :created :modified])
         :entities (all-entities (get-in dashboard [:spec "entities"]) dvs)
         :layout (all-layouts (get-in dashboard [:spec "layout"]) dvs)
         :type "dashboard"
         :status "OK"))
