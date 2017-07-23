(ns akvo.lumen.transformation.geo
  "Geometry data transformations"
  (:require [akvo.lumen.transformation.engine :as engine]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/geo.sql")

(defn valid? [op-spec]
  (let [{column-name-lat "columnNameLat"
         column-name-long "columnNameLong"} (engine/args op-spec)]
    ;; check types are numbers
    (every? engine/valid-column-name? [column-name-lat column-name-long])))

(defmethod engine/valid? :core/generate-geometry [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation :core/generate-geometry
  [tenant-conn table-name columns op-spec]
  (try
    (let [{column-name-lat "columnNameLat"
           column-name-long "columnNameLong"} (engine/args op-spec)]
      (add-geometry-column tenant-conn {:table-name table-name
                                        :column-name-lat column-name-lat
                                        :column-name-long column-name-long})
      {:success? true
       :execution-log [(format "Generated geometry for %s" table-name)]
       :columns columns})
    (catch Exception e
      {:success? false
       :message (.getMessage e)}))
  {:success? true
   :columns columns})

(comment
  (add-geometry-column
    ;tenant-conn
    {:table-name "596cf77d-3e84-4853-8890-c1971a699ee1"
     :column-name-lat "c2"
     :column-name-long "c3"}))
