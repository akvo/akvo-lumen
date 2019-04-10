(ns akvo.lumen.lib.visualisation
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.util :refer [squuid]]
            [hugsql.core :as hugsql])
  (:import [java.sql SQLException]))


(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")

(defn all [tenant-conn]
  (all-visualisations tenant-conn
                      {}
                      {}
                      {:identifiers identity}))

(defn create [tenant-conn body jwt-claims]
  (let [id (squuid)
        v (first (upsert-visualisation tenant-conn
                                       {:id id
                                        :dataset-id (:datasetId body)
                                        :type (:visualisationType body)
                                        :name (:name body)
                                        :spec (:spec body)
                                        :author jwt-claims}))]
    (assoc body
           :id (str id)
           :status "OK"
           :created (:created v)
           :modified (:modified v))))

(defn fetch [tenant-conn id]
  (when-let [v (visualisation-by-id tenant-conn
                                    {:id id}
                                    {}
                                    {:identifiers identity})]
    (dissoc v :author)))

(defn upsert [tenant-conn body jwt-claims]
  (let [v (upsert-visualisation tenant-conn
                                {:id (:id body)
                                 :dataset-id (:datasetId body)
                                 :type (:visualisationType body)
                                 :name (:name body)
                                 :spec (:spec body)
                                 :author jwt-claims})]
    (lib/ok {:id (-> v first :id)})))

(defn delete [tenant-conn id]
  (if (zero? (delete-visualisation-by-id tenant-conn {:id id}))
    (lib/not-found {:error "Not found"})
    (lib/ok {:id id})))
