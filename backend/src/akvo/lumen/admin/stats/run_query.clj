(ns akvo.lumen.admin.stats.run-query
  (:require [akvo.lumen.admin.util :as util]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.pprint :refer [pprint]]
            [clojure.string :as s]))

;; Same env vars as the rest of admin scripts

;; Run query for comma separated list of tenant-labels
(defn -main [tenant-labels query]
  (let [tenant-labels (s/split tenant-labels #",")
        uris (->> ["SELECT label as \"tenant-label\", db_uri as \"db-uri\" FROM tenants"]
                  (jdbc/query (util/db-uri {:database "lumen"}))
                  (filter #((set tenant-labels) (:tenant-label %))))]
    (json/generate-stream
     (for [{:keys [db-uri tenant-label]} uris]
       (jdbc/with-db-transaction [conn db-uri {:read-only? true}]
         [tenant-label (jdbc/query conn [query])]))
     *out*)))
