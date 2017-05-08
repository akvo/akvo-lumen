(ns akvo.lumen.lib.resource-impl
  (:require [akvo.lumen.util :refer [squuid]]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response]])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "akvo/lumen/lib/resource.sql")


(defn all [tenant-conn]
  #_(response {"tiers" (all-tiers tenant-conn
                                  {}
                                  {}
                                  {:identifiers identity})})
  (response {"current-tier" (select-plan tenant-conn)
             "max_number_of_visualisations" {"limit" 50
                                             "used" 25}})
  )
