(ns org.akvo.dash.system
  (:require
   [clojure.java.io :as io]
   [com.stuartsierra.component :as component]
   [duct.component
    [endpoint :refer [endpoint-component]]
    [handler :refer [handler-component]]
    [hikaricp :refer [hikaricp]]
    [ragtime :refer [ragtime]]]
   [duct.middleware.not-found :refer [wrap-not-found]]
   [duct.middleware.route-aliases :refer [wrap-route-aliases]]
   [meta-merge.core :refer [meta-merge]]
   [ring.component.jetty :refer [jetty-server]]
   [ring.middleware.defaults :refer [wrap-defaults api-defaults]]
   [org.akvo.dash.component.http :as http]
   [org.akvo.dash.endpoint
    [datasets :as datasets]
    [root :as root]
    [visualisations :as visualisations]]))

(def base-config
  {:app {:middleware [[wrap-not-found :not-found]
                      [wrap-defaults :defaults]
                      [wrap-route-aliases :aliases]]
         :not-found  (io/resource "org/akvo/dash/errors/404.html")
         :defaults   (meta-merge api-defaults)
         :aliases    {"/" "/index"}}
   :ragtime {:resource-path "org/akvo/dash/migrations"}})

(defn new-system [config]
  (let [config (meta-merge base-config config)]
    (-> (component/system-map
         :app  (handler-component (:app config))
         :http (http/immutant-web (:http config))
         :db   (hikaricp (:db config))
         :ragtime (ragtime (:ragtime config))
         :dataset (endpoint-component datasets/endpoint)
         :root (endpoint-component root/endpoint)
         :visualisations (endpoint-component visualisations/endpoint))
        (component/system-using
         {:http [:app]
          :app  [:root :dataset :visualisations]
          :ragtime [:db]
          :dataset [:db]
          :visualisations [:db]}))))
