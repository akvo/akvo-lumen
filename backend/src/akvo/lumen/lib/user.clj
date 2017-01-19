(ns akvo.lumen.lib.user
  (:require [akvo.lumen.lib.user-impl :as impl]))

(defn all
  "Return all tenants users"
  [tenant]
  (impl/all tenant))
