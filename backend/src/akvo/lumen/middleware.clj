(ns akvo.lumen.middleware
  "add integrant support"
  (:require [clojure.tools.logging :as log]
            [compojure.response :as compojure]
            [integrant.core :as ig]
            [raven-clj.ring]
            [ring.middleware.defaults]
            [ring.middleware.json]
            [ring.middleware.stacktrace]
            [ring.util.response :as response]))

(defn wrap-not-found
  [handler error-response]
  (fn [request]
    (or (handler request)
        (-> (compojure/render error-response request)
            (response/content-type "text/html")
            (response/status 404)))))

(defn wrap-hide-errors [handler error-response]
  (fn [request]
    (try
      (handler request)
      (catch Throwable _
        (-> (compojure/render error-response request)
            (response/content-type "text/html")
            (response/status 500))))))

(defmethod ig/init-key :akvo.lumen.middleware.ring.stacktrace/wrap-stacktrace  [_ opts]  
  ring.middleware.stacktrace/wrap-stacktrace)

(defmethod ig/init-key :akvo.lumen.middleware.ring.json/wrap-json-body  [_ opts]  
  ring.middleware.json/wrap-json-body)

(defmethod ig/init-key :akvo.lumen.middleware.ring.json/wrap-json-response  [_ opts]  
  ring.middleware.json/wrap-json-response)

(defmethod ig/init-key :akvo.lumen.middleware.ring.defaults/wrap-defaults  [_ opts]  
  ring.middleware.defaults/wrap-defaults)

(defmethod ig/init-key :akvo.lumen.middleware.sentry/wrap-sentry  [_ opts]  
  raven-clj.ring/wrap-sentry)

(defmethod ig/init-key :akvo.lumen.middleware.duct.erros/wrap-hide-errors  [_ opts]  
  wrap-hide-errors)

(defmethod ig/init-key :akvo.lumen.middleware.duct.not-found/wrap-not-found  [_ opts]  
  wrap-not-found)
