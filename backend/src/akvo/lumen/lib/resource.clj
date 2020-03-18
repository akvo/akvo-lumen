(ns akvo.lumen.lib.resource
  (:require [akvo.lumen.db.resource :as db.resource]
            [ring.util.response :refer [response]]))

(defn resource-usage
  [tenant-conn]
  (merge (db.resource/count-visualisations tenant-conn {} {} {:identifiers identity})
         (db.resource/count-external-datasets tenant-conn {} {} {:identifiers identity})
         (db.resource/count-dashboards tenant-conn {} {} {:identifiers identity})))

(defn all [tenant-conn]
  (response {"resources" (resource-usage tenant-conn)}))
