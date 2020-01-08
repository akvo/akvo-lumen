(ns akvo.lumen.endpoint.visualisation
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.specs.visualisation :as visualisation.s]
            [akvo.lumen.specs.visualisation.maps :as visualisation.maps.s]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.visualisation.maps :as maps]
            [akvo.lumen.lib.auth :as l.auth]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [clojure.walk :as w]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))

(defn all-visualisations
  ([auth-service tenant-conn]
   (all-visualisations auth-service tenant-conn {:limit nil
                                                 :offset nil}))
  ([auth-service tenant-conn params]
   (let [visualisations      (visualisation/all tenant-conn params)
         auth-visualisations (->> visualisations
                                  (l.auth/ids ::visualisation.s/visualisations)
                                  (p/auth auth-service)
                                  :auth-visualisations)]
     (->> visualisations
          (filter #(contains? auth-visualisations (:id %)))
          (lib/ok)))))

(defn routes [{:keys [windshaft-url tenant-manager] :as opts}]
  ["/visualisations"
   ["" {:get {:handler (fn [{tenant :tenant
                             auth-service :auth-service
                             {:strs [limit offset] :as query-params} :query-params}]
                         (if (or (nil? limit) (nil? offset))
                           (all-visualisations auth-service (p/connection tenant-manager tenant))
                           (let [limit (Integer. (re-find  #"\d+" limit)) ;; VIP
                                 offset (Integer. (re-find  #"\d+" offset))]
                             (all-visualisations auth-service (p/connection tenant-manager tenant) {:limit limit
                                                                                                    :offset offset}))))}
        :post {:parameters {:body map?}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              auth-service :auth-service
                              body :body}]
                          (let [vis-payload (w/keywordize-keys body)
                                ids (l.auth/ids ::visualisation.s/visualisation vis-payload)]
                            (if (p/allow? auth-service ids)
                              (lib/ok (visualisation/create (p/connection tenant-manager tenant) vis-payload jwt-claims))
                              (lib/not-authorized {:ids ids}))))}}]
   ["/maps" ["" {:post {:parameters {:body map?}
                        :handler (fn [{tenant :tenant
                                       body :body}]
                                   (let [{:strs [spec]} body
                                         layers (w/keywordize-keys (get-in spec ["layers"]))]
                                     (maps/create (p/connection tenant-manager tenant) windshaft-url layers)))}}]]
   ;; rasters don't depend on flow data (yet!), so no need to wrap this call
   ["/rasters" ["" {:post {:parameters {:body map?}
                           :handler (fn [{tenant :tenant
                                          body :body}]
                                      (let [{:strs [rasterId spec]} body]
                                        (maps/create-raster (p/connection tenant-manager tenant) windshaft-url rasterId)))}}]]
   ;; todo: fix path routing inconsistency here
   ["/:id"
    {:middleware [(fn [handler]
                    (fn [{{:keys [id]} :path-params
                          auth-service :auth-service
                          :as req}]
                      (if (p/allow? auth-service (l.auth/ids ::visualisation.s/id id))
                        (handler req)
                        (lib/not-authorized {:id id}))))]}
    ["" {:get {:parameters {:path-params {:id string?}}
               :handler (fn [{tenant :tenant
                              auth-service :auth-service
                              {:keys [id]} :path-params}]
                          (if-let [res (visualisation/fetch (p/connection tenant-manager tenant) id)]
                            (let [ids (l.auth/ids ::visualisation.s/visualisation res)]
                              (if (p/allow? auth-service ids)
                                (lib/ok res)
                                (lib/not-authorized ids)))
                            (lib/not-found {:error "Not found"})))}
         :put {:parameters {:body map?
                            :path-params {:id string?}}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              auth-service :auth-service
                              {:keys [id]} :path-params
                              body :body}]
                          (let [vis-payload (w/keywordize-keys body)
                                ids (l.auth/ids ::visualisation.s/visualisation vis-payload)]
                            (if (p/allow? auth-service ids)
                              (lib/ok (visualisation/upsert (p/connection tenant-manager tenant) vis-payload jwt-claims))
                              (lib/not-authorized ids))))}
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
