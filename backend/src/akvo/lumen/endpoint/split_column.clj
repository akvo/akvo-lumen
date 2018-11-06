(ns akvo.lumen.endpoint.split-column
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.transformation.split-column :as transformation]
            [cheshire.core :as json]
            [clojure.tools.logging :as log]
            [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [integrant.core :as ig]))

(hugsql/def-db-fns "akvo/lumen/transformation.sql")

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/split-column" {:keys [query-params tenant] :as request}
           (context "/:dataset-id" [dataset-id]
                    (GET "/pattern-analysis" _
                         (let [query           (json/parse-string (get query-params "query") keyword)
                               tenant-conn     (connection tenant-manager tenant)
                               dataset-version (latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})
                               sql-query       {:table-name  (:table-name dataset-version)
                                                :column-name (:columnName query)
                                                :limit       (str (:limit query "200"))}
                               values (map (comp str (keyword (:columnName query)))
                                           (select-random-column-data tenant-conn sql-query))]
                           (lib/ok (transformation/pattern-analysis (re-pattern "[^a-zA-Z0-9\\s]") values)))))))

(defmethod ig/init-key :akvo.lumen.endpoint.split-column/endpoint  [_ opts]
  (endpoint opts))
