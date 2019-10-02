(ns akvo.lumen.endpoint.split-column
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.lib.transformation.split-column :as transformation]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [cheshire.core :as json]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))

(defn sort-pattern-analysis-by [pattern-analysis sort-by*]
  (->> (seq (:analysis pattern-analysis))
       (sort-by sort-by*)
       (mapv first)))

(defn handler [{:keys [tenant-manager] :as opts}]
  (fn [{{:keys [dataset-id]} :path-params
        query-params :query-params
        tenant :tenant}]
    (let [query           (json/parse-string (get query-params "query") keyword)
          tenant-conn     (p/connection tenant-manager tenant)
          dataset-version (db.transformation/latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})
          sql-query       {:table-name  (:table-name dataset-version)
                           :column-name (:columnName query)
                           :limit       (str (:limit query "200"))}
          values          (map (comp str (keyword (:columnName query)))
                               (db.transformation/select-random-column-data tenant-conn sql-query))
          pattern-analysis (transformation/pattern-analysis (re-pattern "[^a-zA-Z0-9\\s]") values)]
      (lib/ok {:analysis (sort-pattern-analysis-by pattern-analysis :total-row-coincidences)}))))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/split-column/:dataset-id/pattern-analysis"
   {:get {:parameters {:path-params {:dataset-id string?}}
          :responses {200 {}}
          :handler (handler opts)}}])

(defmethod ig/init-key :akvo.lumen.endpoint.split-column/endpoint  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.split-column/endpoint [_]
  (s/keys :req-un [::tenant-manager/tenant-manager] ))
