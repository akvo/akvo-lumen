(ns akvo.lumen.transformation.geo
  "Geometry data transformations"
  (:require [akvo.lumen.transformation.engine :as engine]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/geo.sql")

(defn valid? [op-spec]
  (let [{column-name-lat "columnNameLat"
         column-name-long "columnNameLong"
         column-type-lat "columnTypeLat"
         column-type-long "columnTypeLong"} (engine/args op-spec)]
    (and (every? #(= "number" %) [column-type-lat column-type-long])
         (every? engine/valid-column-name? [column-name-lat column-name-long]))))

(defmethod engine/valid? :core/add-geometry [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation :core/add-geometry
  [tenant-conn table-name columns op-spec]
  (try
    (let [{column-name-lat "columnNameLat"
           column-name-long "columnNameLong"} (engine/args op-spec)]
      (add-geometry tenant-conn {:table-name table-name
                                 :column-name-lat column-name-lat
                                 :column-name-long column-name-long})
      {:success? true
       :execution-log [(format "Added geometry to %s" table-name)]
       :columns columns})
    (catch Exception e
      {:success? false
       :message (.getMessage e)}))
  {:success? true
   :columns columns})
