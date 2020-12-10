(ns akvo.lumen.lib.data-group
  (:require [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.util :as util]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as str]
            [clojure.walk :as walk]))

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

(defn data-groups-temp-view
  [view-name sql]
  (format "CREATE TEMP VIEW %s AS %s" view-name sql))

(defn table-name-and-columns-from-data-grops [tenant-conn dataset-id]
  (when-let [data-groups (seq (->> (db.dataset/data-groups-by-dataset-id tenant-conn {:dataset-id dataset-id})
                                   (map #(update % :columns (comp walk/keywordize-keys vec)))))]
    (let [columns (reduce #(into % (:columns %2)) [] data-groups)
          table-name (util/gen-table-name "ds")]
      (->> data-groups
           data-groups-sql-template
           data-groups-sql
           (data-groups-temp-view table-name)
           vector
           (jdbc/execute! tenant-conn))
      {:table-name table-name :columns columns})))
