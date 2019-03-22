(ns akvo.lumen.lib.visualisation
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.util :refer [squuid]]
            [clojure.set :as set]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")

(defn all [tenant-conn auth-datasets]
  (lib/ok
   (if (seq auth-datasets)
     (let [auth-vis-col (all-auth-visualisations tenant-conn
                                                 {:ids auth-datasets}
                                                 {}
                                                 {:identifiers identity})
           auth-datasets-set (set auth-datasets)
           filtered (filter (fn [vis]
                              (if (not= "map" (:visualisationType vis))
                                true
                                (set/superset? auth-datasets-set
                                               (set (map #(get % "datasetId")
                                                         (get-in vis [:spec "layers"]))))))
                            auth-vis-col)]
       (log/error (count auth-vis-col)
                  (count filtered))
       filtered)
     [])))

(defn create [tenant-conn body jwt-claims]
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
                                {:id (get body "id")
                                 :dataset-id (get body "datasetId")
                                 :type (get body "visualisationType")
                                 :name (get body "name")
                                 :spec (get body "spec")
                                 :author jwt-claims})]
    (lib/ok {:id (-> v first :id)})))

(defn delete [tenant-conn id]
  (if (zero? (delete-visualisation-by-id tenant-conn {:id id}))
    (lib/not-found {:error "Not found"})
    (lib/ok {:id id})))
