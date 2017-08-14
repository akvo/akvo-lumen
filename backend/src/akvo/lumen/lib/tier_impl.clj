(ns akvo.lumen.lib.tier-impl
  (:require [akvo.lumen.util :refer [squuid]]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response]])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "akvo/lumen/lib/tier.sql")


#_(defn all [tenant-conn]
    (response {"tiers" (all-tiers tenant-conn
                                  {}
                                  {}
                                  {:identifiers identity})}))


(def policies ["numberOfExternaldatasets" "numberOfVisualisations"])

(defn tier-policy [m]
  (into {} (map (fn [p]
                  {p (get m p)})
                policies)))


(defn all [tenant-conn]
  (response {"tiers" {"standard" (tier-policy {"numberOfExternaldatasets" 5
                                               "numberOfVisualisations" 50})
                      "pro" (tier-policy {"numberOfExternaldatasets" 20
                                          "numberOfVisualisations" 200})}}))
