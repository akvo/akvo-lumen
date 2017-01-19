(ns akvo.lumen.lib.user
  (:require [akvo.lumen.lib.user-impl :as impl]))

(defn all
  "Return all tenants users"
  [tenant keycloak]
  (impl/all tenant keycloak))
