(ns akvo.lumen.admin.stats.run-manager-query
  (:require [akvo.lumen.admin.util :as util]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.pprint :refer [pprint]]
            [clojure.string :as s]))
;; Same env vars as the rest of admin scripts

;; Run query in lumen (tenant manager)
(defn -main [query]
  (let [uri (util/db-uri-db {:database "lumen"})]
    (json/generate-stream
     (jdbc/with-db-connection [conn uri {:read-only? true}]
       (jdbc/query conn [query]))
     *out*)))
