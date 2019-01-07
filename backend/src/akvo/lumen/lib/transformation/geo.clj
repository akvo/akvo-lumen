(ns akvo.lumen.lib.transformation.geo
  "Geometry data transformations"
  (:require [akvo.lumen.lib.import.common :as import]
            [akvo.lumen.util :as util]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.postgres :as postgres]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/geo.sql")

(defn- valid?
  "Predicate to determine if given op-spec is valid for geo transformation"
  [op-spec]
  (let [{:strs [columnNameLat columnNameLong]} (engine/args op-spec)]
    (boolean
      (every? util/valid-column-name? [columnNameLat columnNameLong]))))

(defmethod engine/valid? "core/generate-geopoints"
  [op-spec]
  (valid? op-spec))

(defn add-index [conn table-name column-name]
  (jdbc/execute! conn (postgres/geo-index table-name column-name)))

(defmethod engine/apply-operation "core/generate-geopoints"
  [{:keys [tenant-conn]} table-name columns op-spec]
  (let [{:strs [columnNameLat columnNameLong columnTitleGeo]} (engine/args op-spec)
        get-client-type (partial engine/column-type columns)
        column-types (map get-client-type [columnNameLat columnNameLong])]
    (if (every? #(= "number" %) column-types)
      (try
        (let [column-name-geo (engine/next-column-name columns)
              opts {:table-name table-name :column-name-geo column-name-geo}]
          (jdbc/with-db-transaction [conn tenant-conn]
            (add-geometry-column conn opts)
            (add-index conn table-name column-name-geo)
            (generate-geopoints conn (conj opts {:column-name-lat columnNameLat
                                                 :column-name-long columnNameLong})))
          (jdbc/execute! tenant-conn "DEALLOCATE ALL")
          {:success? true
           :execution-log [(format "Generated geopoints for %s" table-name)]
           :columns (conj columns {"title" columnTitleGeo
                                   "type" "geopoint"
                                   "sort" nil
                                   "hidden" false
                                   "direction" nil
                                   "columnName" column-name-geo})})
        (catch Exception e
          (log/debug e)
          {:success? false
           :message (.getMessage e)}))
      (let [msg "Selected columns are not all numeric"]
        (log/debug msg)
        {:success? false
         :message msg}))))
