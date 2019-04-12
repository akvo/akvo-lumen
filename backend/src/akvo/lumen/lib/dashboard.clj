(ns akvo.lumen.lib.dashboard
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.util :refer [squuid]]
            [clojure.walk :as w]
            [clojure.java.jdbc :as jdbc]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dashboard.sql")

(defn all [tenant-conn]
  (all-dashboards tenant-conn))

(defn- dashboard-keys-match?
  "Make sure each key in entity have a matching key in layout."
  [dashboard]
  (= (keys (:entities dashboard))
     (keys (:layout dashboard))))

(defn filter-type
  [dashboard-data kind]
  (let [entities (filter #(= kind (:type %))
                         (vals (:entities dashboard-data)))
        ks     (set (map :id entities))]
    {:entities entities
     :layout   (keep #(if (ks (:i %)) %)
                     (vals (:layout dashboard-data)))}))

(defn part-by-entity-type [entities]
  {:visualisations (filter-type entities "visualisation")
   :texts          (filter-type entities "text")})

(defn all-entities
  "Merge text & dashboard_visualisations (dvs) entries, return an id keyed map"
  [text-entities dvs]
  (let [entries (reduce conj text-entities (map (fn [dv]
                                                  {:id   (:visualisation_id dv)
                                                   :type "visualisation"}) dvs ))]
    (zipmap (map (comp keyword :id) entries) entries)))

(defn all-layouts
  "Merge text & dashboard_visualisations (dvs) layouts, return an id keyed map."
  [text-layout dvs]
  (let [layouts (reduce conj text-layout (map :layout dvs))]
    (zipmap (map (comp keyword :i) layouts) layouts)))

(defn build-dashboard-by-id
  [dashboard dvs]
  (assoc (select-keys dashboard [:author :created :id :modified :title])
         :entities (all-entities (get-in dashboard [:spec :entities]) dvs)
         :layout (all-layouts (get-in dashboard [:spec :layout]) dvs)
         :type "dashboard"
         :status "OK"))

(defn handle-dashboard-by-id
  "Hand of packing to pure build-dashboard-by-id"
  [tenant-conn id]
  (build-dashboard-by-id
   (-> (dashboard-by-id tenant-conn {:id id})
       (update :spec w/keywordize-keys))
   (->> (dashboard_visualisation-by-dashboard-id tenant-conn {:dashboard-id id})
        (map #(update % :layout w/keywordize-keys)))))

(defn create
  "With a dashboard spec, first split into visualisation and text entities.
  Insert new dashboard and pass all text entites into the dashboard.spec. Then
  for each visualiation included in the dashboard insert an entry into
  dashboard_visualisation with it's layout data."
  [tenant-conn spec claims]
  (if (dashboard-keys-match? spec)
    (let [dashboard-id (str (squuid))
          parted-spec (part-by-entity-type spec)
          visualisation-layouts (get-in parted-spec [:visualisations :layout])]
      (jdbc/with-db-transaction [tx tenant-conn]
        (insert-dashboard tx {:id dashboard-id
                              :title (:title spec)
                              :spec (:texts parted-spec)
                              :author claims})
        (doseq [visualisation (get-in parted-spec [:visualisations :entities])]
          (let [visualisation-id (:id visualisation)
                layout (first (filter #(= visualisation-id (:i %))
                                      visualisation-layouts))]
            (insert-dashboard_visualisation
             tx {:dashboard-id dashboard-id
                 :visualisation-id visualisation-id
                 :layout layout}))))
      (lib/ok (handle-dashboard-by-id tenant-conn dashboard-id)))
    (lib/bad-request {:error "Entities and layout dashboard keys does not match."})))

(defn fetch [tenant-conn id]
  (if-let [d (dashboard-by-id tenant-conn {:id id})]
    (lib/ok (handle-dashboard-by-id tenant-conn id))
    (lib/not-found {:error "Not found"})))

(defn upsert
  "We update a dashboard via upsert of dashboard and clean - insert of
  dashboard_visualisations.
  1. Unpack text & visualisation entities
  2. Update dashboard tablefq
  3. Remove old dashboard_visualisations
  4. Add new dashboard_visualisations
  "
  [tenant-conn id spec]
  (let [{:keys [texts visualisations]} (part-by-entity-type spec)
        visualisations-layouts (:layout visualisations)]
    (jdbc/with-db-transaction [tx tenant-conn]
      (update-dashboard tx {:id id
                            :title (:title spec)
                            :spec texts})
      (delete-dashboard_visualisation tenant-conn {:dashboard-id id})
      (doseq [visualisation-entity (:entities visualisations)]
        (let [visualisation-id (:id visualisation-entity)
              visualisations-layout (first (filter #(= visualisation-id
                                                       (:i %))
                                                   visualisations-layouts))]
          (insert-dashboard_visualisation
           tx {:dashboard-id id
               :visualisation-id visualisation-id
               :layout visualisations-layout}))))
    (lib/ok (handle-dashboard-by-id tenant-conn id))))

(defn delete [tenant-conn id]
  (delete-dashboard_visualisation tenant-conn {:dashboard-id id})
  (if (zero? (delete-dashboard-by-id tenant-conn {:id id}))
    (lib/not-found {:error "Not round"})
    (lib/ok {:id id})))
