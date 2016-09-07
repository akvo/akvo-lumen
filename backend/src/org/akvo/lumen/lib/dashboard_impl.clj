(ns org.akvo.lumen.lib.dashboard-impl
  (:require [hugsql.core :as hugsql]
            [clojure.java.jdbc :as jdbc]
            [org.akvo.lumen.util :refer [squuid]]
            [org.akvo.lumen.util :refer [squuid]]))


(hugsql/def-db-fns "org/akvo/lumen/lib/dashboard.sql")


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


(defn handle-dashboard-by-id
  "Hand of packing to pure build-dashboard-by-id"
  [tenant-conn id]
  (build-dashboard-by-id
   (dashboard-by-id tenant-conn {:id id})
   (dashboard_visualisation-by-dashboard-id tenant-conn
                                            {:dashboard-id id})))

(defn create
  "With a dashboard spec, first split into visualisation and text entities.
  Insert new dashboard and pass all text entites into the dashboard.spec. Then
  for each visualiation included in the dashboard insert an entry into
  dashboard_visualisation with it's layout data."
  [tenant-conn spec]
  (if (dashboard-keys-match? spec)
    (let [dashboard-id (str (squuid))
          parted-spec  (part-by-entity-type spec)
          visualisation-layouts (get-in parted-spec [:visualisations :layout])]
      (jdbc/with-db-transaction [tx tenant-conn]
        (insert-dashboard tx {:id    dashboard-id
                                   :title (get spec "title")
                                   :spec  (:texts parted-spec)})
        (doseq [visualisation (get-in parted-spec [:visualisations :entities])]
          (let [visualisation-id (get visualisation "id")
                layout (first (filter #(= visualisation-id (get % "i"))
                                       visualisation-layouts))]
            (insert-dashboard_visualisation
             tx {:dashboard-id     dashboard-id
                 :visualisation-id visualisation-id
                 :layout           layout}))))
      (handle-dashboard-by-id tenant-conn dashboard-id))
    {:status 400
     :body "Entities and layout dashboard keys does not match."}))

(defn fetch [tenant-conn id]
  (if-some [d (dashboard-by-id tenant-conn {:id id})]
    (handle-dashboard-by-id tenant-conn id)))

(defn upsert
  "We update a dashboard via upsert of dashboard and clean - insert of
  dashboard_visualisations.
  1. Unpack text & visualisation entities
  2. Update dashboard tablefq
  3. Remove old dashboard_visualisations
  4. Add new dashboard_visualisations
  "
  [tenant-conn id spec]
  (let [{texts          :texts
         visualisations :visualisations} (part-by-entity-type spec)
        visualisations-layouts           (:layout visualisations)]
    (jdbc/with-db-transaction [tx tenant-conn]
      (update-dashboard tx {:id    id
                                 :title (get spec "title")
                                 :spec  texts})
      (delete-dashboard_visualisation tenant-conn {:dashboard-id id})
      (doseq [visualisation-entity (:entities visualisations)]
        (let [visualisation-id      (get visualisation-entity "id")
              visualisations-layout (first (filter #(= visualisation-id
                                                       (get % "i"))
                                                   visualisations-layouts))]
          (insert-dashboard_visualisation
           tx {:dashboard-id     id
               :visualisation-id visualisation-id
               :layout           visualisations-layout}))))
    (handle-dashboard-by-id tenant-conn id)))


(defn delete [tenant-conn id]
  (let [c0 (delete-dashboard_visualisation tenant-conn {:dashboard-id id})
        c1 (delete-dashboard-by-id tenant-conn {:id id})]
    (when (= (+ c0 c1) 2)
      {:id id})))
