(ns akvo.lumen.endpoint.visualisation
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.lib.visualisation.maps :as maps]
            [akvo.lumen.auth :as auth]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [clojure.walk :as w]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))

(defn routes [{:keys [windshaft-url tenant-manager] :as opts}]
  ["/visualisations"
   ["" {:get {:handler (fn [{tenant :tenant
                             auth-datasets :auth-datasets}]
                         (visualisation/all (p/connection tenant-manager tenant) auth-datasets))}
        :post {:parameters {:body map?}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              auth-datasets :auth-datasets
                              body :body}]
                          (visualisation/create (p/connection tenant-manager tenant) body jwt-claims auth-datasets))}}]
   ["/maps" ["" {:post {:parameters {:body map?}
                        :handler (fn [{tenant :tenant
                                       auth-datasets :auth-datasets
                                       body :body}]
                                   (let [{:strs [spec]} body
                                         layers (get-in spec ["layers"])]
                                     (if (visualisation/auth-vis body auth-datasets)
                                       (maps/create (p/connection tenant-manager tenant) windshaft-url (w/keywordize-keys layers))
                                       auth/not-authorized)))}}]]
   ["/rasters" ["" {:post {:parameters {:body map?}
                           :handler (fn [{tenant :tenant
                                          body :body}]
                                      (let [{:strs [rasterId spec]} body]
                                        (maps/create-raster (p/connection tenant-manager tenant) windshaft-url rasterId)))}}]]
   ;; todo: fix path routing inconsistency here 
   ["/:id" ["" {:get {:parameters {:path-params {:id string?}}
                      :handler (fn [{tenant :tenant
                                     auth-datasets :auth-datasets
                                     {:keys [id]} :path-params}]
                                 (visualisation/fetch (p/connection tenant-manager tenant) id auth-datasets))}
                :put {:parameters {:body map?
                                   :path-params {:id string?}}
                      :handler (fn [{tenant :tenant
                                     jwt-claims :jwt-claims
                                     auth-datasets :auth-datasets
                                     {:keys [id]} :path-params
                                     body :body}]
                                 (visualisation/upsert (p/connection tenant-manager tenant) (assoc body "id" id) jwt-claims auth-datasets))}
                :delete {:parameters {:path-params {:id string?}}
                         :handler (fn [{tenant :tenant
                                        auth-datasets :auth-datasets
                                        {:keys [id]} :path-params}]
                                    (visualisation/delete (p/connection tenant-manager tenant) id auth-datasets))}}]]])

(defmethod ig/init-key :akvo.lumen.endpoint.visualisation/visualisation  [_ opts]
  (routes opts))

(s/def ::windshaft-url string?)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.visualisation/visualisation [_]
  (s/keys :req-un [::tenant-manager/tenant-manager
                   ::windshaft-url] ))
