(ns org.akvo.dash.system
  (:require
   [clojure.java.io :as io]
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
   [org.akvo.dash.component.http :as http]
   [org.akvo.dash.endpoint.api :refer [api-endpoint]]
   [org.akvo.dash.endpoint.root :refer [root-endpoint]]
   [org.akvo.dash.endpoint.datasets :refer [datasets-endpoint]]
   [org.akvo.dash.endpoint.visualisations :refer [visualisations-endpoint]]
   [com.akolov.enlive-reload :refer [wrap-enlive-reload]]))

(def base-config
  {:app {:middleware [[wrap-reload] ;; Should only be for development profile?
                      [wrap-enlive-reload]
                      [wrap-not-found :not-found]
                      [wrap-webjars]
                      [wrap-defaults :defaults]
                      [wrap-route-aliases :aliases]]
         :not-found  (io/resource "org/akvo/dash/errors/404.html")
         :defaults   (meta-merge site-defaults
                                 {:static false}
                                 ;; {:static {:resources "runway/public"}}
                                 )
         :aliases    {"/" "/index"}}
   :ragtime {:resource-path "org/akvo/dash/migrations"}})

(defn new-system [config]
  (let [config (meta-merge base-config config)]
    (-> (component/system-map
         :app  (handler-component (:app config))
         :http (http/immutant-web (:http config))
         :db   (hikaricp (:db config))
         :ragtime (ragtime (:ragtime config))
         ;; :api (endpoint-component api-endpoint)
         :root (endpoint-component root-endpoint)
         :dataset (endpoint-component datasets-endpoint)
         :visualisations (endpoint-component visualisations-endpoint)
         )
        (component/system-using
         {:http [:app]
          :app  [:root :dataset :visualisations]
          :ragtime [:db]
          ;; :api [:db]
          :dataset [:db]
          :visualisations [:db]
          }))))
