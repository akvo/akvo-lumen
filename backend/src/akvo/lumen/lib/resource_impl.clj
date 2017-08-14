(ns akvo.lumen.lib.resource-impl
  (:require [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response]]))

(hugsql/def-db-fns "akvo/lumen/lib/resource.sql")


(defn resource-usage
  [tenant-conn]
  (merge (count-visualisations tenant-conn {} {} {:identifiers identity})
         (count-external-datasets tenant-conn {} {} {:identifiers identity})))

(defn all [tenant-conn current-plan]
  (response {"plan" {:tier current-plan}
             "resources" (resource-usage tenant-conn)}))
