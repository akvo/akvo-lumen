(ns org.akvo.dash.system
  (:require
   [clojure.java.io :as io]
   [com.stuartsierra.component :as component]
   [duct.component
    [endpoint :refer [endpoint-component]]
    [handler :refer [handler-component]]
    [hikaricp :refer [hikaricp]]
    ;;[ragtime :refer [ragtime]]
    ]
   [duct.middleware.not-found :refer [wrap-not-found]]
   [duct.middleware.route-aliases :refer [wrap-route-aliases]]
   [meta-merge.core :refer [meta-merge]]
   [ring.middleware.defaults :refer [wrap-defaults api-defaults]]
   [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
   [org.akvo.db-util]
   [org.akvo.dash.migrate :refer [migrate]]
   [org.akvo.dash.component
    [http :as http]
    [tenants :as tenants]]
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
                      tenants/wrap-label-tenant
                      wrap-json-body
                      wrap-json-response]
         :not-found  (io/resource "org/akvo/dash/errors/404.html")
         :defaults   (meta-merge api-defaults
                                 {:params {:multipart true}})
         :aliases    {"/" "/index"}}
   ;; :ragtime {:resource-path "org/akvo/dash/migrations"}
   })

(defn new-system [config]
  ;; (migrate config)
  (let [config (meta-merge base-config config)]
    (-> (component/system-map
         :app  (handler-component (:app config))
         :http (http/immutant-web (:http config))

         ;; :activity (endpoint-component activity/endpoint)
         ;; :dataset (endpoint-component dataset/endpoint)
         :db   (hikaricp (:db config))
         ;; :files (endpoint-component files/endpoint)
         :library (endpoint-component library/endpoint)
         :root (endpoint-component root/endpoint)
         :lord (tenants/lord)
         :visualisation (endpoint-component visualisation/endpoint))

        (component/system-using
         {:http          [:app]
          :app           [:lord :db :root :library]
          ;;:app           [:root :activity :dataset :library :visualisation :files :lord :db]
          :root          [:lord]
          :library       [:lord]
          :lord          [:db]
          ;; :activity      [:db]
          ;; :dataset       [:db]
          ;; :visualisation [:db]
          }
         ))))
