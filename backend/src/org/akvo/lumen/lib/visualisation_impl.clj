(ns org.akvo.lumen.lib.visualisation-impl
  (:require [hugsql.core :as hugsql]
            [org.akvo.lumen.util :refer [squuid]])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "org/akvo/lumen/endpoint/visualisation.sql")



(defn all [tenant-conn]
  (all-visualisations tenant-conn
                      {}
                      {}
                      {:identifiers identity}))

(defn create [tenant-conn body claims]
  (try
    (let [id (squuid)
          resp (first (upsert-visualisation tenant-conn
                                            {:id id
                                             :dataset-id (get body "datasetId")
                                             :type (get body "visualisationType")
                                             :name (get body "name")
                                             :spec (get body "spec")
                                             :author claims}))]
      (assoc body
             "id" (str id)
             "status" "OK"
             "created" (:created resp)
             "modified" (:modified resp)))
    (catch Exception e
      (.printStackTrace e)
      (when (isa? SQLException (type e))
        (.printStackTrace (.getNextException ^SQLException e)))
      {:status 400})))


(defn fetch [tenant-conn id]
  (dissoc (visualisation-by-id tenant-conn
                               {:id id}
                               {}
                               {:identifiers identity})
          :author))

(defn upsert [tenant-conn body claims]
  (upsert-visualisation tenant-conn
                        {:id (get body "id")
                         :dataset-id (get body "datasetId")
                         :type (get body "visualisationType")
                         :name (get body "name")
                         :spec (get body "spec")
                         :author claims}))

(defn delete [tenant-conn id]
  (try
    (delete-visualisation-by-id tenant-conn {:id id})
    {:ok [{:id id}]}
    (catch Exception e
      (.printStackTrace e)
      (when (isa? SQLException (type e))
        (.printStackTrace (.getNextException ^SQLException e)))
      {:error [e]})))
