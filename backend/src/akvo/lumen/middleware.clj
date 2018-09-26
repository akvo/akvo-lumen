(ns akvo.lumen.middleware
  "add integrant support"
  (:require [integrant.core :as ig]
            [ring.middleware.json]
            [ring.middleware.stacktrace]
            [ring.middleware.defaults]
            [raven-clj.ring]
            [akvo.lumen.component.tenant-manager]
            [akvo.lumen.auth]
            [duct.middleware.errors]
            [duct.middleware.not-found]
            [clojure.tools.logging :as log]))

(defmethod ig/init-key :akvo.lumen.middleware.ring.stacktrace/wrap-stacktrace  [_ opts]  
  ring.middleware.stacktrace/wrap-stacktrace)

(defmethod ig/halt-key! :akvo.lumen.middleware.ring.stacktrace/wrap-stacktrace  [_ opts]  
  {})

(defmethod ig/init-key :akvo.lumen.middleware.ring.json/wrap-json-body  [_ opts]  
  ring.middleware.json/wrap-json-body)

(defmethod ig/halt-key! :akvo.lumen.middleware.ring.json/wrap-json-body  [_ opts]  
  {})

(defmethod ig/init-key :akvo.lumen.middleware.ring.json/wrap-json-response  [_ opts]  
  ring.middleware.json/wrap-json-response)

(defmethod ig/halt-key! :akvo.lumen.middleware.ring.json/wrap-json-response  [_ opts]  
  {})

(defmethod ig/init-key :akvo.lumen.middleware.ring.defaults/wrap-defaults  [_ opts]  
  ring.middleware.defaults/wrap-defaults)

(defmethod ig/halt-key! :akvo.lumen.middleware.ring.defaults/wrap-defaults  [_ opts]  
  {})

(defmethod ig/init-key :akvo.lumen.middleware.auth/wrap-auth  [_ opts]  
  akvo.lumen.auth/wrap-auth)

(defmethod ig/halt-key! :akvo.lumen.middleware.auth/wrap-auth  [_ opts]  
  {})

(defmethod ig/init-key :akvo.lumen.middleware.auth/wrap-jwt  [_ opts]  
  akvo.lumen.auth/wrap-jwt)

(defmethod ig/halt-key! :akvo.lumen.middleware.auth/wrap-jwt  [_ opts]  
  {})

(defmethod ig/init-key :akvo.lumen.middleware.tenant-manager/wrap-label-tenant  [_ opts]  
  akvo.lumen.component.tenant-manager/wrap-label-tenant)

(defmethod ig/halt-key! :akvo.lumen.middleware.tenant-manager/wrap-label-tenant  [_ opts]  
  {})

(defmethod ig/init-key :akvo.lumen.middleware.sentry/wrap-sentry  [_ opts]  
  raven-clj.ring/wrap-sentry)

(defmethod ig/halt-key! :akvo.lumen.middleware.sentry/wrap-sentry  [_ opts]  
  {})

(defmethod ig/init-key :akvo.lumen.middleware.duct.erros/wrap-hide-errors  [_ opts]  
  duct.middleware.errors/wrap-hide-errors)

(defmethod ig/halt-key! :akvo.lumen.middleware.duct.erros/wrap-hide-errors  [_ opts]  
  {})

(defmethod ig/init-key :akvo.lumen.middleware.duct.not-found/wrap-not-found  [_ opts]  
  duct.middleware.not-found/wrap-not-found)

(defmethod ig/halt-key! :akvo.lumen.middleware.duct.not-found/wrap-not-found  [_ opts]  
  {})
