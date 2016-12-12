(ns org.akvo.lumen.lib.visualisation-impl
  (:require [hugsql.core :as hugsql]
            [org.akvo.lumen.util :refer [squuid]]
            [ring.util.response :refer [not-found response]])
  (:import [java.sql SQLException]))


(hugsql/def-db-fns "org/akvo/lumen/lib/visualisation.sql")


(defn all [tenant-conn]
  (response (all-visualisations tenant-conn
                                 {}
                                 {}
                                 {:identifiers identity})))

(defn create [tenant-conn body jwt-claims]
  (let [id (squuid)
        v (first (upsert-visualisation tenant-conn
                                       {:id id
                                        :dataset-id (get body "datasetId")
                                        :type (get body "visualisationType")
                                        :name (get body "name")
                                        :spec (get body "spec")
                                        :author jwt-claims}))]
    (response (assoc body
                     "id" (str id)
                     "status" "OK"
                     "created" (:created v)
                     "modified" (:modified v)))))

(defn fetch [tenant-conn id]
  (if-let [v (visualisation-by-id tenant-conn
                                  {:id id}
                                  {}
                                  {:identifiers identity})]
    (response (dissoc v :author))
    (not-found {:error "Not found"})))

(defn upsert [tenant-conn body jwt-claims]
  (let [v (upsert-visualisation tenant-conn
                                {:id (get body "id")
                                 :dataset-id (get body "datasetId")
                                 :type (get body "visualisationType")
                                 :name (get body "name")
                                 :spec (get body "spec")
                                 :author jwt-claims})]
    (response {:id (-> v first :id)})))

(defn delete [tenant-conn id]
  (if (zero? (delete-visualisation-by-id tenant-conn {:id id}))
    (not-found {:error "Not found"})
    (response {:id id})))
