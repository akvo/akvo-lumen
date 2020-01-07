(ns akvo.lumen.lib.visualisation
  (:require [akvo.lumen.db.visualisation :as db.visualisation]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.util :refer [squuid]])
  (:import [java.sql SQLException]))


(defn all
  [tenant-conn params]
  (db.visualisation/all-visualisations tenant-conn
                                       params
                                       {}
                                       {:identifiers identity}))

(defn create [tenant-conn body jwt-claims]
  (let [id (squuid)
        v (first (db.visualisation/upsert-visualisation tenant-conn
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
  (when-let [v (db.visualisation/visualisation-by-id tenant-conn
                                    {:id id}
                                    {}
                                    {:identifiers identity})]
    (dissoc v :author)))

(defn upsert [tenant-conn body jwt-claims]
  (let [v (db.visualisation/upsert-visualisation tenant-conn
                                {:id (:id body)
                                 :dataset-id (:datasetId body)
                                 :type (:visualisationType body)
                                 :name (:name body)
                                 :spec (:spec body)
                                 :author jwt-claims})]
    {:id (-> v first :id)}))

(defn delete [tenant-conn id]
  (if (zero? (db.visualisation/delete-visualisation-by-id tenant-conn {:id id}))
    (lib/not-found {:error "Not found"})
    (lib/ok {:id id})))
