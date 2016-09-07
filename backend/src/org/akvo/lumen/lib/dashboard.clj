(ns org.akvo.lumen.lib.dashboard
  (:require [clojure.java.jdbc :as jdbc]
            [org.akvo.lumen.util :refer [squuid]]
            [org.akvo.lumen.lib.dashboard-impl :as impl]))


(defn all-dashboards [tenant-conn]
  (impl/all-dashboards tenant-conn))

(defn handle-dashboard-by-id
  "Hand of packing to pure build-dashboard-by-id"
  [tenant-conn id]
  (impl/build-dashboard-by-id
   (impl/dashboard-by-id tenant-conn {:id id})
   (impl/dashboard_visualisation-by-dashboard-id tenant-conn
                                                 {:dashboard-id id})))

(defn handle-new-dashboard
  "With a dashboard spec, first split into visualisation and text entities.
  Insert new dashboard and pass all text entites into the dashboard.spec. Then
  for each visualiation included in the dashboard insert an entry into
  dashboard_visualisation with it's layout data."
  [tenant-conn spec]
  (if (impl/dashboard-keys-match? spec)
    (let [dashboard-id (str (squuid))
          parted-spec  (impl/part-by-entity-type spec)
          visualisation-layouts (get-in parted-spec [:visualisations :layout])]
      (jdbc/with-db-transaction [tx tenant-conn]
        (impl/insert-dashboard tx {:id    dashboard-id
                                   :title (get spec "title")
                                   :spec  (:texts parted-spec)})
        (doseq [visualisation (get-in parted-spec [:visualisations :entities])]
          (let [visualisation-id (get visualisation "id")
                layout (first (filter #(= visualisation-id (get % "i"))
                                       visualisation-layouts))]
            (impl/insert-dashboard_visualisation
             tx {:dashboard-id     dashboard-id
                 :visualisation-id visualisation-id
                 :layout           layout}))))
      (handle-dashboard-by-id tenant-conn dashboard-id))
    (throw (Exception. "Entities and layout dashboard keys does not match."))))


(defn dashboard-by-id
  ""
  [tenant-conn param]
  (impl/dashboard-by-id tenant-conn param))

(defn persist-dashboard
  "We update a dashboard via upsert of dashboard and clean - insert of
  dashboard_visualisations.
  1. Unpack text & visualisation entities
  2. Update dashboard table
  3. Remove old dashboard_visualisations
  4. Add new dashboard_visualisations
  "
  [tenant-conn id spec]
  (let [{texts          :texts
         visualisations :visualisations} (impl/part-by-entity-type spec)
        visualisations-layouts           (:layout visualisations)]
    (jdbc/with-db-transaction [tx tenant-conn]
      (impl/update-dashboard tx {:id    id
                                 :title (get spec "title")
                                 :spec  texts})
      (impl/delete-dashboard_visualisation tenant-conn {:dashboard-id id})
      (doseq [visualisation-entity (:entities visualisations)]
        (let [visualisation-id      (get visualisation-entity "id")
              visualisations-layout (first (filter #(= visualisation-id
                                                       (get % "i"))
                                                   visualisations-layouts))]
          (impl/insert-dashboard_visualisation
           tx {:dashboard-id     id
               :visualisation-id visualisation-id
               :layout           visualisations-layout}))))
    (handle-dashboard-by-id tenant-conn id)))

(defn handle-dashboard-delete [tenant-conn id]
  (impl/delete-dashboard_visualisation tenant-conn {:dashboard-id id})
  (impl/delete-dashboard-by-id tenant-conn {:id id})
  {:status "OK"})
