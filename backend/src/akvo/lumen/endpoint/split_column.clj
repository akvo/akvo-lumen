(ns akvo.lumen.endpoint.split-column
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.transformation.split-column :as transformation]
            [akvo.lumen.specs.components :refer (integrant-key)]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [cheshire.core :as json]
            [clojure.tools.logging :as log]
            [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [integrant.core :as ig]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")

(defn sort-pattern-analysis-by [pattern-analysis sort-by*]
  (->> (seq (:analysis pattern-analysis))
       (sort-by sort-by*)
       (mapv first)))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/split-column" {:keys [query-params tenant] :as request}
           (context "/:dataset-id" [dataset-id]
                    (GET "/pattern-analysis" _
                         (let [query           (json/parse-string (get query-params "query") keyword)
                               tenant-conn     (p/connection tenant-manager tenant)
                               dataset-version (latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})
                               sql-query       {:table-name  (:table-name dataset-version)
                                                :column-name (:columnName query)
                                                :limit       (str (:limit query "200"))}
                               values          (map (comp str (keyword (:columnName query)))
                                                    (select-random-column-data tenant-conn sql-query))
                               pattern-analysis (transformation/pattern-analysis (re-pattern "[^a-zA-Z0-9\\s]") values)]
                           (lib/ok {:analysis (sort-pattern-analysis-by pattern-analysis :total-row-coincidences)}))))))

(defmethod ig/init-key :akvo.lumen.endpoint.split-column/endpoint  [_ opts]
  (endpoint opts))

(defmethod integrant-key :akvo.lumen.endpoint.split-column/endpoint [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager] )))
