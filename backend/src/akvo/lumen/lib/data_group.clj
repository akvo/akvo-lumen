(ns akvo.lumen.lib.data-group
  (:require [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.db.data-group :as db.data-group]
            [akvo.lumen.db.persisted-view :as db.persisted-view]
            [akvo.lumen.util :as util]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [clojure.string :as str]
            [clojure.walk :as walk])
  (:import [org.postgresql.util PSQLException]))

(defn data-groups-sql-template
  "Returns a data structure useful to generate a SELECT statement with the data groups passed as
  parameter. We keep all columns for `metadata` groupId, and we *drop* `rnum` and `instance_id`
  from all other data groups."
  [data-groups]
  (let [adapted-dgs (reduce
                     (fn [dgs {:keys [columns group-id table-name]}]
                       (conj dgs
                             {:table-name table-name
                              :metadata? (= group-id "metadata")
                              :columns (if (= group-id "metadata")
                                         columns
                                         (remove (fn [{:keys [columnName]}]
                                                   (or (= "instance_id" columnName)
                                                       (= "rnum" columnName)))
                                                 columns))}))
                     []
                     data-groups)]
    {:select (mapv :columnName (flatten (map :columns adapted-dgs)))
     :from {:metadata (->> adapted-dgs (filter :metadata?) first :table-name)
            :others (->> adapted-dgs (filter #(not (:metadata? %))) (mapv :table-name))}}))

(defn data-groups-sql
  [{:keys [select from]}]
  (str/trim
   (str/join " "
             [(str "SELECT " (str/join ", "
                                       (map #(if (= "instance_id" %) "m.instance_id" %) select)))
              (if (:metadata from)
                (format "FROM %s m" (:metadata from))
                (format "FROM %s" (first (:others from))))
              (when (:metadata from)
                (str/join " "
                          (map #(format "LEFT JOIN %1$s ON m.instance_id = %1$s.instance_id" %)
                               (:others from))))])))

(defn data-groups-view
  [view-name temporary? sql]
  (format "CREATE %s VIEW %s AS %s" (if temporary? "TEMP" "") view-name sql))

(defn view-table-name [uuid]
  (let [pattern "dsv_view_"
        uuid (str/replace uuid "-" "_")]
    (if (str/includes? uuid pattern)
      uuid
      (str pattern uuid))))

(defn drop-view! [conn uuid]
  (let [view-name (view-table-name uuid)]
    ;;(db.data-group/exists-view? conn view-name)
    (jdbc/execute! conn [(format "DROP VIEW IF EXISTS %s" view-name)])))

(defn log** [x]
  (log/error x)
  x)

(defn- all-dg-columns [data-groups]
  (reduce #(into % (:columns %2)) [] data-groups))

(defn- datagroup-by-column [data-groups column-name]
  (->> data-groups
       (filter (fn [dg] (seq (filter #(= column-name (get % :columnName)) (:columns dg)))))
       first))

(defn- response [tenant-conn data-groups t-name & [all-columns update?]]
  (when update?
    (drop-view! tenant-conn t-name))
  (let [columns (all-dg-columns data-groups)]
      (if-not (db.data-group/exists-view? tenant-conn t-name)
        (->> data-groups
             log**
             data-groups-sql-template
             log**
             data-groups-sql
             log**
             (data-groups-view t-name false)
             vector
             log**
             (jdbc/execute! tenant-conn)))
      {:table-name t-name :columns (or all-columns columns)}))

(defn- main-metadata
  "data-groups persistent view needs at least metadata or main for the following joins"
  [all-data-groups]
  (first (or (seq (filter #(= "metadata" (:group-id %)) all-data-groups))
             (seq (filter #(= "main" (:group-id %)) all-data-groups)))))

(defn- data-groups-selected
  "returns only data-groups referenced by cols plus metadata/main data-group"
  [all-data-groups cols]
  (into #{(main-metadata all-data-groups)}
        (mapv (partial datagroup-by-column all-data-groups) cols)))

(defn- response-with-updated-persisted-view
  "create or update a persisted view"
  [tenant-conn viz-id dataset-version-id all-data-groups cols & [persistent-view-id]]
  (let [data-groups-selected* (data-groups-selected all-data-groups cols)
        opts                  {:visualisation-id   viz-id
                               :dataset-version-id dataset-version-id
                               :data-groups        (map (fn [x]
                                                          {:id (:data-group-id x)}
                                                          ) data-groups-selected*)}
        view-id               (if persistent-view-id
                      (db.persisted-view/update-persisted-view tenant-conn (assoc opts :id persistent-view-id) )
                      (db.persisted-view/insert-persisted-view tenant-conn opts))]
    (response tenant-conn data-groups-selected* (view-table-name viz-id) (all-dg-columns all-data-groups) (boolean persistent-view-id))))

(defn- persisted-view-not-updated?
  "is there more columns from different data-groups related in the new expected persisted-view?"
  [persisted-view-data-groups all-data-groups cols]
  (= (set (map :data-group-id persisted-view-data-groups))
     (set (map :data-group-id (data-groups-selected all-data-groups cols)))))

(defn create-view-from-data-groups
  "if visualisation-id the persisted view based on viz-id and dsv-id
  else the persisted view is only based on dsv-id"
  [tenant-conn dataset-id & [viz-id cols]]
  (when-let [all-data-groups (seq (->> (db.dataset/data-groups-by-dataset-id tenant-conn {:dataset-id dataset-id})
                                       (map #(update % :columns (comp walk/keywordize-keys vec)))))]
    (let [dataset-version-id (:dataset-version-id (first all-data-groups))
          _ (log/error :dataset-version-id dataset-version-id :viz-id viz-id)]
      (if viz-id
        (if-let [persisted-view-data-groups (db.persisted-view/get-persisted-view tenant-conn {:visualisation-id viz-id :dataset-version-id dataset-version-id})]
          (if (persisted-view-not-updated? persisted-view-data-groups all-data-groups cols)
            (response tenant-conn persisted-view-data-groups (view-table-name viz-id) (all-dg-columns all-data-groups))
            (response-with-updated-persisted-view tenant-conn viz-id dataset-version-id all-data-groups cols (-> persisted-view-data-groups first :id)))
          (response-with-updated-persisted-view tenant-conn viz-id dataset-version-id all-data-groups cols))
        (jdbc/with-db-transaction [tx-conn tenant-conn]
          (when-let [persisted-views (db.persisted-view/get-persisted-views-by-dsv tx-conn {:dataset-version-id dataset-version-id})]
            (doseq [pvs persisted-views]
              (let [{:keys [id spec visualisationtype]} (akvo.lumen.db.visualisation/visualisation-by-id tx-conn {:id (:visualisation-id pvs)})]
                (create-view-from-data-groups tx-conn dataset-id
                                              id
                                              (akvo.lumen.lib.aggregation.commons/cols* visualisationtype (walk/keywordize-keys spec))))))
          (response tx-conn all-data-groups (view-table-name (:dataset-version-id (first all-data-groups)))))))))

(defn move-persisted-view
  "update persisted views with visualisation specs, from dsv1 to dsv2, (eg: after transformations) to ensure view is consistent "
  [tenant-conn dataset-id dsv1 dsv2]
  (log/error ::move-persisted-view dsv1 dsv2)
  (when (and dsv1 dsv2 (not= dsv1 dsv2))
    (jdbc/with-db-transaction [tx-conn tenant-conn]
      (doseq [pvs (db.persisted-view/get-persisted-views-by-dsv tx-conn {:dataset-version-id dsv1})]
        (db.persisted-view/db-delete-persistent-view tx-conn {:id (:id pvs)})
        (let [{:keys [id spec visualisationtype]} (akvo.lumen.db.visualisation/visualisation-by-id tx-conn {:id (:visualisation-id pvs)})]
          (create-view-from-data-groups tx-conn dataset-id
                                        id
                                        (akvo.lumen.lib.aggregation.commons/cols* visualisationtype (walk/keywordize-keys spec))))))))
