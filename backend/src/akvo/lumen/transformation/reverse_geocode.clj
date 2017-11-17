(ns akvo.lumen.transformation.reverse-geocode
  (:require [akvo.lumen.transformation.engine :as engine]
            [clojure.java.jdbc :as jdbc]))

(defmethod engine/valid? :core/reverse-geocode
  [op-spec]
  true)

(defmethod engine/apply-operation :core/reverse-geocode
  [conn table-name columns op-spec]
  (let [column-name (engine/next-column-name columns)]
    (jdbc/execute! conn (format "ALTER TABLE %s ADD COLUMN %s text" table-name column-name))
    (jdbc/execute! conn (format "UPDATE %s SET %s=world.adm2_name FROM world WHERE ST_Contains(world.geom, %s)"
                                table-name column-name (get-in op-spec ["args", "target", "geopointColumn"])))
    {:success? true
     :execution-log ["Geocoded"]
     :columns (conj columns
                    {"title" (get-in op-spec ["args" "target" "title"])
                     "type" "text"
                     "sort" nil
                     "hidden" false
                     "direction" nil
                     "columnName" column-name})}))
