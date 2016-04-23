(ns org.akvo.dash.system
  (:require [akvo.commons.psql-util]
            [clojure.java.io :as io]
            [com.stuartsierra.component :as component]
            [duct.component
             [endpoint :refer [endpoint-component]]
             [handler :refer [handler-component]]
             [hikaricp :refer [hikaricp]]]
            [duct.middleware
             [not-found :refer [wrap-not-found]]
             [route-aliases :refer [wrap-route-aliases]]]
            [meta-merge.core :refer [meta-merge]]
            [org.akvo.dash.component
             [http :as http]
             [tenant-manager :as tm]]
            [org.akvo.dash.endpoint
             [dataset :as dataset]
             [files :as files]
             [flow :as flow]
             [library :as library]
             [root :as root]
             [visualisation :as visualisation]]
            [org.akvo.dash.middleware :refer [wrap-auth wrap-jwt]]
            [ring.middleware
             [defaults :refer [api-defaults wrap-defaults]]
             [json :refer [wrap-json-body wrap-json-response]]]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; System
;;;

(def base-config
  {:app {:middleware [wrap-json-response
                      [wrap-not-found :not-found]
                      [wrap-defaults :defaults]
                      [wrap-route-aliases :aliases]
                      wrap-json-body
                      wrap-auth
                      [wrap-jwt :jwt]
                      tm/wrap-label-tenant]
         :jwt        "https://login.test.akvo-ops.org/auth/realms/akvo"
         :not-found  (io/resource "org/akvo/dash/errors/404.html")
         :defaults   (meta-merge api-defaults
                                 {:params {:multipart true}})
         :aliases    {"/" "/index"}}})


(defn new-system [config]
  (let [config (meta-merge base-config config)]
    (-> (component/system-map
         :app  (handler-component (:app config))
         :http (http/immutant-web (:http config))
         :dataset (endpoint-component (dataset/endpoint (select-keys config [:flow-report-database-url])))
         :db   (hikaricp (:db config))
         :files (endpoint-component files/endpoint)
         :flow (endpoint-component (flow/endpoint (select-keys config [:flow-report-database-url])))
         :library (endpoint-component library/endpoint)
         :tenant-manager (tm/manager)
         :root (endpoint-component root/endpoint)
         :visualisation (endpoint-component visualisation/endpoint))
        (component/system-using
         {:http           [:app]
          :app            [:dataset :files :flow :library :tenant-manager :root
                           :visualisation]
          :root           [:tenant-manager]
          :library        [:tenant-manager]
          :flow           [:tenant-manager]
          :tenant-manager [:db]
          :dataset        [:tenant-manager]
          :visualisation  [:tenant-manager]}))))
