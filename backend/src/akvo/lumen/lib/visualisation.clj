(ns akvo.lumen.lib.visualisation
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.util :refer [squuid]]
            [hugsql.core :as hugsql])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")

(defn all [tenant-conn]
  (lib/ok (all-visualisations tenant-conn
                              {}
                              {}
                              {:identifiers identity})))

(defn create [tenant-conn body jwt-claims]
  (let [id (squuid)
        v (first (upsert-visualisation tenant-conn
                                       {:id id
                                        :dataset-id (:datasetId body)
                                        :type (:visualisationType body)
                                        :name (:name body)
                                        :spec (:spec body)
                                        :author jwt-claims}))]
    (lib/ok (assoc body
                   "id" (str id)
                   "status" "OK"
                   "created" (:created v)
                   "modified" (:modified v)))))

(defn fetch [tenant-conn id]
  (if-let [v (visualisation-by-id tenant-conn
                                  {:id id}
                                  {}
                                  {:identifiers identity})]
    (lib/ok (dissoc v :author))
    (lib/not-found {:error "Not found"})))

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
