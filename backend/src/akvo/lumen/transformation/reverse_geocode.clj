(ns akvo.lumen.transformation.reverse-geocode
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/reverse_geocode.sql")

(defmethod engine/valid? :core/reverse-geocode
  [op-spec]
  (let [{:keys [target source]} (get op-spec :args)]
    (and (string? (get target :title))
         (engine/valid-column-name? (get target :geopointColumn))
         (engine/valid-dataset-id? (get source :datasetId))
         (engine/valid-column-name? (get source :geoshapeColumn))
         (engine/valid-column-name? (get source :mergeColumn)))))

(defn table-qualify [table-name column-name]
  (str table-name "." column-name))

(defn source-table-name [conn {:keys [datasetId]}]
  (-> (latest-dataset-version-by-dataset-id conn {:dataset-id datasetId})
      :table-name))

(defmethod engine/apply-operation :core/reverse-geocode
  [conn table-name columns {:keys [args] :as op-spec}]
  (let [column-name (engine/next-column-name columns)
        {:keys [target source]} args
        geopointColumn (get target :geopointColumn)
        {:keys [mergeColumn geoshapeColumn]} source
        source-table-name (source-table-name conn source)]
    (add-column conn {:column-type "text"
                      :new-column-name column-name
                      :table-name table-name})
    (reverse-geocode conn {:point-column (table-qualify table-name geopointColumn)
                           :shape-column (table-qualify source-table-name geoshapeColumn)
                           :source-column-name (table-qualify source-table-name mergeColumn)
                           :source-table-name source-table-name
                           :target-column-name column-name
                           :target-table-name table-name})
    {:success? true
     :execution-log ["Geocoded"]
     :columns (conj columns
                    {"title" (get target :title)
                     "type" "text"
                     "sort" nil
                     "hidden" false
                     "direction" nil
                     "columnName" column-name})}))
