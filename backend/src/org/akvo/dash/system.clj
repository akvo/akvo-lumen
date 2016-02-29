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
   [ring.middleware.defaults :refer [wrap-defaults api-defaults]]
   [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
   [org.akvo.db-util]
   [org.akvo.dash.component
    [http :as http]]
   [org.akvo.dash.endpoint
    [activity :as activity]
    [dataset :as dataset]
    [library :as library]
    [root :as root]
    [visualisation :as visualisation]
    [files :as files]]))

(def base-config
  {:app {:middleware [[wrap-not-found :not-found]
                      [wrap-defaults :defaults]
                      [wrap-route-aliases :aliases]
                      wrap-json-body
                      wrap-json-response]
         :not-found  (io/resource "org/akvo/dash/errors/404.html")
         :defaults   (meta-merge api-defaults
                                 {:params {:multipart true}})
         :aliases    {"/" "/index"}}
   :ragtime {:resource-path "org/akvo/dash/migrations"}})

(defn new-system [config]
  (let [config (meta-merge base-config config)]
    (-> (component/system-map
         :app  (handler-component (:app config))
         :http (http/immutant-web (:http config))
         :db   (hikaricp (:db config))
         :ragtime (ragtime (:ragtime config))
         :activity (endpoint-component activity/endpoint)
         :library (endpoint-component library/endpoint)
         :dataset (endpoint-component dataset/endpoint)
         :root (endpoint-component root/endpoint)
         :visualisation (endpoint-component visualisation/endpoint)
         :files (endpoint-component files/endpoint))

        (component/system-using
         {:http [:app]
          :app  [:root :activity :dataset :library :visualisation :files]
          :activity [:db]
          :dataset [:db]
          :library [:db]
          :ragtime [:db]
          :visualisation [:db]}))))
