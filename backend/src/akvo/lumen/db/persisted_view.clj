(ns akvo.lumen.db.persisted-view
  (:require [hugsql.core :as hugsql]
            [clojure.java.jdbc :as jdbc]
            [akvo.lumen.util :as util]
            [clojure.tools.logging :as log]))

(hugsql/def-db-fns "akvo/lumen/db/persisted_view.sql")

(defn insert-persisted-view [db-conn {:keys [visualisation-id dataset-version-id data-groups]}]
  (let [id (util/squuid)]
    (jdbc/with-db-transaction [conn db-conn]
      (db-insert-persisted-view
       conn
       {:id id
        :visualisation-id visualisation-id
        :dataset-version-id dataset-version-id})
      (mapv #(db-insert-persisted-view-data-group
              conn
              {:id (akvo.lumen.util/squuid)
               :data-group-id (:id %)
               :persisted-view-id id}) data-groups))
    (str id)))

(defn update-persisted-view [db-conn {:keys [visualisation-id dataset-version-id data-groups id]}]
  (jdbc/with-db-transaction [conn db-conn]
    (log/error :data-groups data-groups :id id)
    (db-delete-all-persistent-view-data-groups conn {:id id})
    (mapv #(db-insert-persisted-view-data-group
            conn
            {:id (akvo.lumen.util/squuid)
             :data-group-id (:id %)
             :persisted-view-id id}) data-groups))
  (str id))

(defn get-persisted-view [db-conn {:keys [visualisation-id dataset-version-id] :as opts}]
  (db-get-persisted-view db-conn opts))
