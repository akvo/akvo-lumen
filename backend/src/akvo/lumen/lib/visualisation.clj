(ns akvo.lumen.lib.visualisation
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.util :refer [squuid]]
            [clojure.set :as set]
            [akvo.lumen.auth :as auth]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")

(defn check-vis-ds [ds-id auth-datasets]
  (or (nil? ds-id) (contains? (set auth-datasets) ds-id)))

(defn auth-vis [auth-datasets-set vis]
  (if (= "map" (:visualisationType vis))
    (set/superset? auth-datasets-set
                   (set (map #(get % "datasetId")
                             (get-in vis [:spec "layers"]))))
    (check-vis-ds (:datasetId vis) auth-datasets-set)))

(defn all [tenant-conn auth-datasets]
  (lib/ok
   (if (seq auth-datasets)
     (let [auth-vis-col (all-auth-visualisations tenant-conn
                                                 {:ids auth-datasets}
                                                 {}
                                                 {:identifiers identity})
           auth-vis* (partial auth-vis (set auth-datasets)) 
           filtered (filter auth-vis* auth-vis-col)]
       (log/error (count auth-vis-col) (count filtered))
       filtered)
     [])))

(defn create [tenant-conn body jwt-claims auth-datasets]
  (if (check-vis-ds (get body "datasetId") auth-datasets)
    (let [id (squuid)
          v (first (upsert-visualisation tenant-conn
                                         {:id id
                                          :dataset-id (get body "datasetId")
                                          :type (get body "visualisationType")
                                          :name (get body "name")
                                          :spec (get body "spec")
                                          :author jwt-claims}))]
      (lib/ok (assoc body
                     "id" (str id)
                     "status" "OK"
                     "created" (:created v)
                     "modified" (:modified v))))
    auth/not-authorized))

(defn fetch [tenant-conn id auth-datasets]
  (if-let [v (visualisation-by-id tenant-conn
                                  {:id id}
                                  {}
                                  {:identifiers identity})]
    (if (check-vis-ds (:datasetId v) auth-datasets)
      (lib/ok (dissoc v :author))
      auth/not-authorized)
    (lib/not-found {:error "Not found"})))

(defn upsert [tenant-conn body jwt-claims auth-datasets]
  (if (check-vis-ds (get body "datasetId") auth-datasets)
    (let [v (upsert-visualisation tenant-conn
                                  {:id (get body "id")
                                   :dataset-id (get body "datasetId")
                                   :type (get body "visualisationType")
                                   :name (get body "name")
                                   :spec (get body "spec")
                                   :author jwt-claims})]
      (lib/ok {:id (-> v first :id)}))
    auth/not-authorized))

(defn delete [tenant-conn id auth-datasets]
  (if (check-vis-ds (:datasetId (visualisation-by-id tenant-conn {:id id} {} {:identifiers identity}))
                    auth-datasets)
    (if (zero? (delete-visualisation-by-id tenant-conn {:id id}))
      (lib/not-found {:error "Not found"})
      (lib/ok {:id id}))
    auth/not-authorized))
