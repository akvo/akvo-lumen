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
   ["" {:get {:handler (fn [{tenant :tenant
                             db-query-service :db-query-service}]
                         (visualisation/all db-query-service))}
        :post {:parameters {:body map?}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              db-query-service :db-query-service
                              body :body}]
                          (visualisation/create db-query-service (w/keywordize-keys body) jwt-claims))}}]
   ["/maps" ["" {:post {:parameters {:body map?}
                        :handler (fn [{tenant :tenant
                                       db-query-service :db-query-service
                                       body :body}]
                                   (let [{:strs [spec]} body
                                         layers (w/keywordize-keys (get-in spec ["layers"]))]
                                     (maps/create db-query-service windshaft-url layers)))}}]]
   ;; rasters don't depend on flow data (yet!), so no need to wrap this call 
   ["/rasters" ["" {:post {:parameters {:body map?}
                           :handler (fn [{tenant :tenant
                                          body :body}]
                                      (let [{:strs [rasterId spec]} body]
                                        (maps/create-raster (p/connection tenant-manager tenant) windshaft-url rasterId)))}}]]
   ;; todo: fix path routing inconsistency here 
   ["/:id" ["" {:get {:parameters {:path-params {:id string?}}
                      :handler (fn [{tenant :tenant
                                     db-query-service :db-query-service
                                       {:keys [id]} :path-params}]
                                   (visualisation/fetch db-query-service id))}
                  :put {:parameters {:body map?
                                     :path-params {:id string?}}
                        :handler (fn [{tenant :tenant
                                       jwt-claims :jwt-claims
                                       db-query-service :db-query-service
                                       {:keys [id]} :path-params
                                       body :body}]
                                   (visualisation/update* db-query-service (assoc (w/keywordize-keys body) :id id) jwt-claims))}
                  :delete {:parameters {:path-params {:id string?}}
                           :handler (fn [{tenant :tenant
                                          db-query-service :db-query-service
                                          {:keys [id]} :path-params}]
                                      (visualisation/delete db-query-service id))}}]]])

(defmethod ig/init-key :akvo.lumen.endpoint.visualisation/visualisation  [_ opts]
  (routes opts))

(s/def ::windshaft-url string?)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.visualisation/visualisation [_]
  (s/keys :req-un [::tenant-manager/tenant-manager
                   ::windshaft-url] ))
