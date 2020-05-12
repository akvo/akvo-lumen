(ns dev.endpoints.feature-flags
  (:require [clojure.tools.logging :as log]
            [clojure.java.io :as io]
            [cheshire.core :as json]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.env :as env]
            [integrant.core :as ig]))

(defn routes [{:keys [routes-opts tenant-manager] :as opts}]
  ["/feature-flags"
   (merge {:get {:handler (fn [{tenant :tenant
                                query-params :query-params
                                auth-service :auth-service}]
                            (if-let [value (get query-params "value")]
                              (lib/ok

                               (first (env/upsert (p/connection tenant-manager tenant)
                                                  (get query-params "id")
                                                  (json/parse-string-strict value keyword))))
                              
                              (lib/ok (env/all (p/connection tenant-manager tenant)))
                              )
)}}
          (when routes-opts routes-opts))
   
   ])

(defmethod ig/init-key :dev.endpoints.feature-flags/endpoint  [_ opts]
  (routes opts))
