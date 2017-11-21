(ns akvo.lumen.transformation.reverse-geocode
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/reverse_geocode.sql")

(defmethod engine/valid? :core/reverse-geocode
  [op-spec]
  (let [{:strs [target source]} (get op-spec "args")]
    (and (string? (get target "title"))
         (engine/valid-column-name? (get target "geopointColumn"))
         (if (nil? source)
           true
           (and
            (engine/valid-dataset-id? (get source "datasetId"))
            (engine/valid-column-name? (get source "geoshapeColumn"))
            (engine/valid-column-name? (get source "mergeColumn")))))))

(defn table-qualify [table-name column-name]
  (str table-name "." column-name))

(defn source-table-name [conn source-spec]
  (if (nil? source-spec)
    "world"
    (latest-dataset-version-by-dataset-id conn {:dataset-id (get source-spec "datasetId")})))

(defn source-merge-column [source-spec]
  (if (nil? source-spec)
    "adm2_name"
    (get source-spec "mergeColumn")))

(defn source-shape-column [source-spec]
  (if (nil? source-spec)
    "geom"
    (get source-spec "geoshapeColumn")))

(defmethod engine/apply-operation :core/reverse-geocode
  [conn table-name columns op-spec]
  (let [column-name (engine/next-column-name columns)
        {:strs [target source]} (get op-spec "args")
        source-table-name (source-table-name conn source)]
    (add-column conn {:table-name table-name :new-column-name column-name :column-type "text"})
    (reverse-geocode conn {:target-table-name table-name
                           :target-column-name column-name
                           :point-column (table-qualify table-name (get target "geopointColumn"))
                           :source-table-name source-table-name
                           :source-column-name (table-qualify source-table-name (source-merge-column source))
                           :shape-column (table-qualify source-table-name (source-shape-column source))})
    {:success? true
     :execution-log ["Geocoded"]
     :columns (conj columns
                    {"title" (get target "title")
                     "type" "text"
                     "sort" nil
                     "hidden" false
                     "direction" nil
                     "columnName" column-name})}))
