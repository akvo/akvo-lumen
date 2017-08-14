(ns akvo.lumen.transformation.geo
  "Geometry data transformations"
  (:require [clojure.java.jdbc :as jdbc]
            [akvo.lumen.transformation.engine :as engine]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/geo.sql")

(defn- valid?
  "Predicate to determine if given op-spec is valid for geo transformation"
  [op-spec]
  (let [{:strs [columnNameLat columnNameLong
                columnTypeLat columnTypeLong]} (engine/args op-spec)]
    (boolean
      (and (every? engine/valid-column-name? [columnNameLat columnNameLong])
           (every? #(= "number" %) [columnTypeLat columnTypeLong])))))

(defmethod engine/valid? :core/generate-geopoints [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation :core/generate-geopoints
  [tenant-conn table-name columns op-spec]
  (try
    (let [{:strs [columnNameLat columnNameLong columnTitleGeo]} (engine/args op-spec)
          column-name-geo (engine/next-column-name columns)
          opts {:table-name table-name :column-name-geo column-name-geo}]
      (jdbc/with-db-transaction [conn tenant-conn]
        (add-geometry-column conn opts)
        (generate-geopoints conn (conj opts {:column-name-lat columnNameLat
                                             :column-name-long columnNameLong})))
      ;; TODO - remove original lat/long columns
      {:success? true
       :execution-log [(format "Generated geopoints for %s" table-name)]
       :columns (conj columns {"title" columnTitleGeo
                               "type" "geopoint"
                               "sort" nil
                               "hidden" false
                               "direction" nil
                               "columnName" column-name-geo})})
    (catch Exception e
      {:success? false
       :message (.getMessage e)})))
