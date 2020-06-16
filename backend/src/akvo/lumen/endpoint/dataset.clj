(ns akvo.lumen.endpoint.dataset
  (:require [akvo.lumen.component.caddisfly :as caddisfly]
            [akvo.lumen.component.error-tracker :as error-tracker]
            [akvo.lumen.component.flow]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.auth :as l.auth]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.specs.dataset :as dataset.s]
            [akvo.lumen.upload :as upload]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [clojure.walk :as w]
            [integrant.core :as ig]))

(defn all-datasets [auth-service tenant-conn]
  (let [res (dataset/all* tenant-conn)
        ids (l.auth/ids ::dataset.s/datasets res)
        auth-datasets (:auth-datasets (p/auth auth-service ids))
        auth-res (filter #(contains? auth-datasets (:id %)) res)]
    (lib/ok auth-res)))

(def fetch-column-params {:path-params {:id string?
                                        :column-name string?}
                          :query-params {:limit (s/nilable string?)}})

(defn routes [{:keys [upload-config import-config error-tracker tenant-manager caddisfly] :as opts}]
  ["/datasets"
   ["" {:get {:handler (fn [{tenant :tenant
                             auth-service :auth-service}]
                         (all-datasets auth-service (p/connection tenant-manager tenant)))}
        :post {:parameters {:body map?}
               :handler (fn [{tenant :tenant
                              jwt-claims :jwt-claims
                              jwt-token :jwt-token
                              body :body}]
                          (dataset/create (p/connection tenant-manager tenant) (merge import-config upload-config)
                                          error-tracker jwt-claims (-> (w/stringify-keys body)
                                                                       (assoc-in ["source" "email"] (get jwt-claims "email"))
                                                                       (assoc-in ["source" "token"] jwt-token))))}}]
   ["/:id"
    {:middleware [(fn [handler]
                    (fn [{{:keys [id]} :path-params
                          auth-service :auth-service
                          :as req}]
                      (if (p/allow? auth-service (l.auth/ids ::dataset.s/id id))
                        (handler req)
                        (lib/not-authorized {:id id}))))]}
    [["" {:get {:parameters {:path-params {:id string?}}
                :handler (fn [{tenant :tenant
                               auth-service :auth-service
                               {:keys [id]} :path-params}]
                           (if-let [res (dataset/fetch (p/connection tenant-manager tenant) id)]
                             (lib/ok res)
                             (lib/not-found {:error "Not found"})))}
          :put {:parameters {:body map?
                             :path-params {:id string?}}
                :handler (fn [{tenant :tenant
                               body :body
                               {:keys [id]} :path-params}]
                           (dataset/update-meta (p/connection tenant-manager tenant) id body))}
          :delete {:parameters {:path-params {:id string?}}
                   :handler (fn [{tenant :tenant
                                  {:keys [id]} :path-params}]
                              (dataset/delete (p/connection tenant-manager tenant) id))}}]
     ;; get meta organised by groups
     ["/groups" {:get {:parameters {:path-params {:id string?}}
                       :handler (fn [{tenant :tenant
                                      {:keys [id]} :path-params}]
                                  (dataset/fetch-groups-metadata (p/connection tenant-manager tenant) id))}}]
     ["/group"
      [["/:group-id" {:get {:parameters {:path-params {:id string?
                                                        :group-id string?}}
                             :handler (fn [{tenant :tenant

                                            {:keys [id group-id]} :path-params}]
                                        (if-let [res (dataset/fetch-group (p/connection tenant-manager tenant) id group-id)]
                                          (lib/ok res)
                                          (lib/not-found {:error "Not found"})))}}]]]
     ["/sort"
      [["/:column-name/text" {:get {:parameters fetch-column-params
                                    :handler (fn [{tenant :tenant
                                                   {:keys [id column-name]} :path-params
                                                   query-params :query-params}]
                                               (lib/ok (dataset/sort-text (p/connection tenant-manager tenant) id column-name (get query-params "limit") (get query-params "order"))))}}]]
      [["/:column-name/number" {:get {:parameters {:path-params {:id string?
                                                                 :column-name string?}}
                                      :handler (fn [{tenant :tenant
                                                     {:keys [id column-name]} :path-params}]
                                                 (lib/ok (dataset/sort-number (p/connection tenant-manager tenant) id column-name)))}}]]]
     ["/meta" {:get {:parameters {:path-params {:id string?}}
                     :handler (fn [{tenant :tenant
                                    {:keys [id]} :path-params}]
                                (dataset/fetch-metadata (p/connection tenant-manager tenant) id))}}]
     ["/update" {:post {:parameters {:path-params {:id string?}}
                        :handler (fn [{tenant :tenant
                                       jwt-claims :jwt-claims
                                       jwt-token :jwt-token
                                       body :body
                                       {:keys [id]} :path-params}]
                                   (dataset/update* (p/connection tenant-manager tenant) caddisfly (merge import-config upload-config)
                                                   error-tracker id (assoc (w/stringify-keys body)
                                                                           "token" jwt-token
                                                                           "email" (get jwt-claims "email"))))}}]]]])


(defmethod ig/init-key :akvo.lumen.endpoint.dataset/dataset  [_ opts]
  (routes opts))

(s/def ::upload-config ::upload/config)
(s/def ::flow-api :akvo.lumen.component.flow/config)
(s/def ::import-config (s/keys :req-un [::flow-api]))
(s/def ::config (s/keys :req-un [::tenant-manager/tenant-manager
                                 ::error-tracker/error-tracker
                                 ::caddisfly/caddisfly
                                 ::upload-config
                                 ::import-config]))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.dataset/dataset [_]
  ::config)
