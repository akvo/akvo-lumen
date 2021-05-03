(ns akvo.lumen.lib.data-group
  (:require [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.db.data-group :as db.data-group]
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
  (str "dsv_view_" (str/replace uuid "-" "_")))

(defn drop-view! [conn dataset-version-2-id]
  (let [view-name (view-table-name dataset-version-2-id)]
    (db.data-group/exists-view? conn view-name)
    (log/error :drop-view view-name)
   (jdbc/execute! conn [(format "DROP VIEW IF EXISTS %s" view-name)])))

(defn create-view-from-data-groups
  [tenant-conn dataset-id]
  (when-let [data-groups (seq (->> (db.dataset/data-groups-by-dataset-id tenant-conn {:dataset-id dataset-id})
                                   (map #(update % :columns (comp walk/keywordize-keys vec)))))]
    (let [columns (reduce #(into % (:columns %2)) [] data-groups)
          t-name (view-table-name (:dataset-version-id (first data-groups)))]
      (log/error :create-view-from-data-groups t-name :dataset-id dataset-id :dsv-id (:dataset-version-id (first data-groups)))
      (if-not (db.data-group/exists-view? tenant-conn t-name)
        (->> data-groups
             data-groups-sql-template
             data-groups-sql
             (data-groups-view t-name false)
             vector
             (jdbc/execute! tenant-conn)))
      {:table-name t-name :columns columns})))
