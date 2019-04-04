(ns akvo.lumen.lib.visualisation
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.util :refer [squuid]]
            [akvo.lumen.protocols :as p]
            [hugsql.core :as hugsql])
  (:import [java.sql SQLException]))


(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")

(defn all [dbqs]
  (lib/ok (p/query dbqs #'all-visualisations {} {} {:identifiers identity})))

(defn create [dbqs body jwt-claims]
  (if (or (nil? (:datasetId body)) (p/authorised? dbqs :dataset (:datasetId body)))
      (let [id (squuid)
            query-res (p/query dbqs #'upsert-visualisation {:id id
                                                            :dataset-id (:datasetId body)
                                                            :type (:visualisationType body )
                                                            :name (:name body)
                                                            :spec (:spec body)
                                                            :author jwt-claims})
            v (first query-res)]
        (lib/ok (assoc body
                       "id" (str id)
                       "status" "OK"
                       "created" (:created v)
                       "modified" (:modified v))))
    (lib/unprocessable-entity {})))

(defn fetch [dbqs id]
  (if-let [v (p/query dbqs #'visualisation-by-id {:id id} {} {:identifiers identity})]
    (lib/ok (dissoc v :author))
    (lib/not-found {:error "Not found"})))

(defn upsert [dbqs body jwt-claims]
  (let [v (p/query dbqs #'upsert-visualisation 
                   {:id (:id body)
                    :dataset-id (:datasetId body)
                    :type (:visualisationType body)
                    :name (:name body)
                    :spec (:spec body)
                    :author jwt-claims})]
    (lib/ok {:id (-> v first :id)})))

(defn delete [dbqs id]
  (if (zero? (p/query dbqs #'delete-visualisation-by-id {:id id}) )
    (lib/not-found {:error "Not found"})
    (lib/ok {:id id})))
