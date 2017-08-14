(ns akvo.lumen.lib.tier-impl
  (:require
   [ring.util.response :refer [not-found response]]))


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
