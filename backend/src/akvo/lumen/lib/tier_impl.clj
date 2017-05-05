(ns akvo.lumen.lib.tier-impl
  (:require [akvo.lumen.util :refer [squuid]]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response]])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "akvo/lumen/lib/tier.sql")


(defn all [tenant-conn]
  (response {"tiers" (all-tiers tenant-conn
                                {}
                                {}
                                {:identifiers identity})}))
