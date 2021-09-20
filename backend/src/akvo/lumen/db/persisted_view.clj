(ns akvo.lumen.db.persisted-view
  (:require [hugsql.core :as hugsql]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]))

(hugsql/def-db-fns "akvo/lumen/db/persisted_view.sql")

(defn insert-persisted-view [db-conn id {:keys [visualisation-id dataset-version-id data-groups]}]
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
  (str id))
