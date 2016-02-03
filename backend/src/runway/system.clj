(ns runway.system
  (:require [clojure.java.io :as io]
            [com.stuartsierra.component :as component]
            [duct.component.endpoint :refer [endpoint-component]]
            [duct.component.handler :refer [handler-component]]
            [duct.component.hikaricp :refer [hikaricp]]
            [duct.component.ragtime :refer [ragtime]]
            [duct.middleware.not-found :refer [wrap-not-found]]
            [duct.middleware.route-aliases :refer [wrap-route-aliases]]
            [meta-merge.core :refer [meta-merge]]
            [ring.component.jetty :refer [jetty-server]]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [ring.middleware.reload :refer [wrap-reload]]
            [ring.middleware.webjars :refer [wrap-webjars]]
            [runway.endpoint.home :refer [home-endpoint]]
            [runway.endpoint.api :refer [api-endpoint]]
            [runway.endpoint.assets :refer [assets-endpoint]]
            [runway.component.http :as http]
            [com.akolov.enlive-reload :refer [wrap-enlive-reload]]
            ))

(def base-config
  {:app {:middleware [[wrap-reload] ;; Should only be for development profile?
                      [wrap-enlive-reload]
                      [wrap-not-found :not-found]
                      [wrap-webjars]
                      [wrap-defaults :defaults]
                      [wrap-route-aliases :aliases]]
         :not-found  (io/resource "runway/errors/404.html")
         :defaults   (meta-merge site-defaults
                                 {:static false}
                                 ;; {:static {:resources "runway/public"}}
                                 )
         :aliases    {"/" "/index"}}
   :ragtime {:resource-path "runway/migrations"}})

(defn new-system [config]
  (let [config (meta-merge base-config config)]
    (-> (component/system-map
         :app  (handler-component (:app config))
         :http (http/immutant-web (:http config))
         :db   (hikaricp (:db config))
         :ragtime (ragtime (:ragtime config))
         :home (endpoint-component home-endpoint)
         :api (endpoint-component api-endpoint)
         :assets (endpoint-component assets-endpoint)
         )
        (component/system-using
         {:http [:app]
          :app  [:home :assets :api]
          :ragtime [:db]
          :home [:db]
          :api [:db]
          }))))
