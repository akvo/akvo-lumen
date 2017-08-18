(ns akvo.lumen.lib.tier-impl
  (:require
   [ring.util.response :refer [response]]))

(defn all [tenant-conn]
  (response {"tiers" {"unlimited" {"numberOfExternalDatasets" "*"
                                   "numberOfVisualisations" "*"}
                      "standard" {"numberOfExternalDatasets" 5
                                  "numberOfVisualisations" 50}
                      "pro" {"numberOfExternalDatasets" 20
                             "numberOfVisualisations" 200}}}))
