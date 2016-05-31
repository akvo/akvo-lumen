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
             [public :as public]
             [root :as root]
             [share :as share]
             [visualisation :as visualisation]
             [transformation :as transformation]
             [job-execution :as job-execution]]
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
         :app (handler-component (:app config))
         :config config
         :dataset (endpoint-component dataset/endpoint)
         :db   (hikaricp (:db config))
         :files (endpoint-component files/endpoint)
         :flow (endpoint-component flow/endpoint)
         :http (http/immutant-web (:http config))
         :library (endpoint-component library/endpoint)
         :public (endpoint-component public/endpoint)
         :root (endpoint-component root/endpoint)
         :share (endpoint-component share/endpoint)
         :tenant-manager (tm/manager)
         :visualisation (endpoint-component visualisation/endpoint)
         :transformation (endpoint-component transformation/endpoint)
         :job-execution (endpoint-component job-execution/endpoint))
        (component/system-using
         {:http           [:app]
          :app            [:tenant-manager :dataset :files :flow
                           :library :public :root :share :visualisation
                           :transformation :job-execution]
          :tenant-manager [:db]
          :root           [:tenant-manager]
          :dataset        [:tenant-manager :config]
          :files          [:config]
          :flow           [:tenant-manager :config]
          :library        [:tenant-manager]
          :public         [:tenant-manager]
          :share          [:tenant-manager :config]
          :visualisation  [:tenant-manager]
          :transformation [:tenant-manager]
          :job-execution  [:tenant-manager]}))))
