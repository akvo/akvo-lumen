(ns akvo.lumen.lib.visualisation
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.util :refer [squuid]]
            [clojure.set :as set]
            [clojure.tools.logging :as log]
            [clojure.walk :as w]
            [hugsql.core :as hugsql])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")

(defn- check-vis-ds [ds-id auth-datasets]
  (or (nil? ds-id) (contains? (set auth-datasets) ds-id)))

(defn auth-vis [auth-datasets vis]
  (let [vis (w/keywordize-keys vis)
        auth-datasets-set (set auth-datasets)]
    (if (= "map" (:visualisationType vis))
      (set/superset? auth-datasets-set
                     (set (filter some? (map :datasetId (get-in vis [:spec :layers])))))
      (check-vis-ds (:datasetId vis) auth-datasets-set))))

(defn all [tenant-conn auth-datasets]
  (lib/ok
   (if (seq auth-datasets)
     (let [auth-vis-col (all-auth-visualisations tenant-conn
                                                 {:ids auth-datasets}
                                                 {}
                                                 {:identifiers identity})
           auth-vis* (partial auth-vis auth-datasets) 
           filtered (filter auth-vis* auth-vis-col)
           ]
       (log/error (count auth-vis-col) (count filtered))
       filtered)
     [])))

(defn create [tenant-conn body jwt-claims auth-datasets]
  (if (auth-vis auth-datasets body)
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
    (lib/not-authorized nil)))

(defn public-fetch
  "no auth here"
  [tenant-conn id]
  (if-let [v (visualisation-by-id tenant-conn
                                  {:id id}
                                  {}
                                  {:identifiers identity})]
    (lib/ok (dissoc v :author))
    (lib/not-found {:error "Not found"})))

(defn fetch [tenant-conn id auth-datasets]
  (if-let [v (visualisation-by-id tenant-conn
                                  {:id id}
                                  {}
                                  {:identifiers identity})]
    (if (auth-vis auth-datasets v)
      (lib/ok (dissoc v :author))
      (lib/not-authorized nil))
    (lib/not-found {:error "Not found"})))

(defn upsert [tenant-conn body jwt-claims auth-datasets]
  (if (auth-vis auth-datasets body)
    (let [v (upsert-visualisation tenant-conn
                                  {:id (get body "id")
                                   :dataset-id (get body "datasetId")
                                   :type (get body "visualisationType")
                                   :name (get body "name")
                                   :spec (get body "spec")
                                   :author jwt-claims})]
      (lib/ok {:id (-> v first :id)}))
    (lib/not-authorized nil)))

(defn delete [tenant-conn id auth-datasets]
  (if (auth-vis auth-datasets (visualisation-by-id tenant-conn {:id id} {} {:identifiers identity}))
    (if (zero? (delete-visualisation-by-id tenant-conn {:id id}))
      (lib/not-found {:error "Not found"})
      (lib/ok {:id id}))
    (lib/not-authorized nil)))
