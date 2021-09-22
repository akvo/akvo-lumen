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

(defn- response [tenant-conn data-groups t-name & [all-columns temp?]]
  (let [columns (all-dg-columns data-groups)]
    (when-not (db.data-group/exists-view? tenant-conn t-name)
      (->> data-groups
;;           log**
           data-groups-sql-template
           log**
           data-groups-sql
           log**
           (data-groups-view t-name (boolean temp?))
           vector
           log**
           (jdbc/execute! tenant-conn)))
    {:table-name t-name :columns (or all-columns columns)}))

(defn- main-metadata
  [all-data-groups]
  (first (or (seq (filter #(= "metadata" (:group-id %)) all-data-groups))
             (seq (filter #(= "main" (:group-id %)) all-data-groups)))))

(defn- data-groups-selected
  "returns only data-groups referenced by cols plus metadata/main data-group"
  [all-data-groups cols]
  (into #{(main-metadata all-data-groups)}
        (mapv (partial datagroup-by-column all-data-groups) cols)))

(defn- temp-view-response-with-selected-data-groups
  [tenant-conn viz-id dataset-version-id all-data-groups cols]
  (let [data-groups-selected* (data-groups-selected all-data-groups cols)]
    (response tenant-conn
              data-groups-selected*
              (view-table-name viz-id)
              (all-dg-columns all-data-groups)
              true)))

(defn create-view-from-data-groups
  [tenant-conn dataset-id & [viz-id cols]]
  (when-let [all-data-groups (seq (->> (db.dataset/data-groups-by-dataset-id tenant-conn {:dataset-id dataset-id})
                                       (map #(update % :columns (comp walk/keywordize-keys vec)))))]
    (let [dataset-version-id (:dataset-version-id (first all-data-groups))]
      (if viz-id
        (temp-view-response-with-selected-data-groups tenant-conn viz-id dataset-version-id all-data-groups cols)
        (response tenant-conn all-data-groups
                  (view-table-name (:dataset-version-id (first all-data-groups))))))))
