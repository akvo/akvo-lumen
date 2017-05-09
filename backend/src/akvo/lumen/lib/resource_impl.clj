(ns akvo.lumen.lib.resource-impl
  (:require [akvo.lumen.util :refer [squuid]]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response]])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "akvo/lumen/lib/resource.sql")


(defn current-plan [tenant-conn]
  (if-let [r (select-plan tenant-conn)]
    r
    "planless"))

(defn all [tenant-conn]
  (response {"plan" (current-plan tenant-conn)
             "resources" {"numberOfVisualisations"
                          (count-visualisations tenant-conn)}}))
