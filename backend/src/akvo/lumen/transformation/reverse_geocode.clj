(ns akvo.lumen.transformation.reverse-geocode
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/transformation/engine.sql")
(hugsql/def-db-fns "akvo/lumen/transformation/reverse_geocode.sql")

(defmethod engine/valid? :core/reverse-geocode
  [op-spec]
  true)

(defmethod engine/apply-operation :core/reverse-geocode
  [conn table-name columns op-spec]
  (let [column-name (engine/next-column-name columns)]
    (add-column conn {:table-name table-name :new-column-name column-name :column-type "text"})
    (reverse-geocode conn {:target-table-name table-name
                           :target-column-name column-name
                           :point-column (get-in op-spec ["args", "target", "geopointColumn"])
                           :source-table-name "world"
                           :source-column-name "world.adm2_name"
                           :shape-column "world.geom"})
    {:success? true
     :execution-log ["Geocoded"]
     :columns (conj columns
                    {"title" (get-in op-spec ["args" "target" "title"])
                     "type" "text"
                     "sort" nil
                     "hidden" false
                     "direction" nil
                     "columnName" column-name})}))
