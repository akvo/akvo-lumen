(ns akvo.lumen.endpoint.visualisation
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.lib.visualisation.maps :as maps]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [clojure.walk :as w]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))

(defn routes [{:keys [windshaft-url tenant-manager] :as opts}]
  ["/visualisations"
   ["" {:get {:handler (fn [{tenant :tenant}]
                         (visualisation/all (p/connection tenant-manager tenant)))}
        :post {:parameters {:body map?}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              body :body}]
                          (visualisation/create (p/connection tenant-manager tenant) (w/keywordize-keys body) jwt-claims))}}]
   ["/maps" ["" {:post {:parameters {:body map?}
                        :handler (fn [{tenant :tenant
                                       body :body}]
                                   (let [{:strs [spec]} body
                                         layers (get-in spec ["layers"])]
                                     (maps/create (p/connection tenant-manager tenant) windshaft-url (w/keywordize-keys layers))))}}]]
   ["/rasters" ["" {:post {:parameters {:body map?}
                           :handler (fn [{tenant :tenant
                                          body :body}]
                                      (let [{:strs [rasterId spec]} body]
                                        (maps/create-raster (p/connection tenant-manager tenant) windshaft-url rasterId)
                                        ))}}]]
   ;; todo: fix path routing inconsistency here 
   ["/:id" ["" {:get {:parameters {:path-params {:id string?}}
                        :handler (fn [{tenant :tenant
                                       {:keys [id]} :path-params}]
                                   (visualisation/fetch (p/connection tenant-manager tenant) id))}
                  :put {:parameters {:body map?
                                     :path-params {:id string?}}
                        :handler (fn [{tenant :tenant
                                       jwt-claims :jwt-claims
                                       {:keys [id]} :path-params
                                       body :body}]
                                   (visualisation/upsert (p/connection tenant-manager tenant) (assoc (w/keywordize-keys body) :id id) jwt-claims))}
                  :delete {:parameters {:path-params {:id string?}}
                           :handler (fn [{tenant :tenant
                                          {:keys [id]} :path-params}]
                                      (visualisation/delete (p/connection tenant-manager tenant) id))}}]]])

(defmethod ig/init-key :akvo.lumen.endpoint.visualisation/visualisation  [_ opts]
  (routes opts))

(s/def ::windshaft-url string?)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.visualisation/visualisation [_]
  (s/keys :req-un [::tenant-manager/tenant-manager
                   ::windshaft-url] ))
