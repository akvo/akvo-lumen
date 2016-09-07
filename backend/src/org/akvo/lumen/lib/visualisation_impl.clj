(ns org.akvo.lumen.lib.visualisation-impl
  (:require [hugsql.core :as hugsql]
            [org.akvo.lumen.util :refer [squuid]])
  (:import [java.sql SQLException]))


(hugsql/def-db-fns "org/akvo/lumen/lib/visualisation.sql")


(defn all [tenant-conn]
  (all-visualisations tenant-conn
                      {}
                      {}
                      {:identifiers identity}))

(defn create [tenant-conn body jwt-claims]
  (let [id (squuid)
        v (first (upsert-visualisation tenant-conn
                                       {:id id
                                        :dataset-id (get body "datasetId")
                                        :type (get body "visualisationType")
                                        :name (get body "name")
                                        :spec (get body "spec")
                                        :author jwt-claims}))]
    (assoc body
           "id" (str id)
           "status" "OK"
           "created" (:created v)
           "modified" (:modified v))))

(defn fetch [tenant-conn id]
  (dissoc (visualisation-by-id tenant-conn
                               {:id id}
                               {}
                               {:identifiers identity})
          :author))

(defn upsert [tenant-conn body jwt-claims]
  (let [v (upsert-visualisation tenant-conn
                                {:id (get body "id")
                                 :dataset-id (get body "datasetId")
                                 :type (get body "visualisationType")
                                 :name (get body "name")
                                 :spec (get body "spec")
                                 :author jwt-claims})]
    {:id (-> v first :id)}))

(defn delete [tenant-conn id]
  (let [c (delete-visualisation-by-id tenant-conn {:id id})]
    (when (not (zero? c))
      {:id id})))
