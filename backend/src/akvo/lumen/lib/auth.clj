(ns akvo.lumen.lib.auth
  (:require
   [akvo.commons.jwt :as jwt]
   [akvo.lumen.component.flow :as c.flow]
   [akvo.lumen.protocols :as p]
   [reitit.core :as rc]
   [clojure.spec.alpha :as s]
   [clojure.tools.logging :as log]
   [clojure.string :as str]
   [hugsql.core :as hugsql]
   [integrant.core :as ig]
   ;; [ring.util.response :as response]
   ))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn load-fun [kw & no-auth?]
  (eval (symbol (str/join  "/" [(namespace kw) (if no-auth?
                                                 (name kw)
                                                 (str "auth-" (name kw)))]))))

(load-fun :akvo.lumen.lib.dataset/all-datasets)

(defrecord AuthorisedDBQueryService [tenant-conn authorised-uuid-tree]
  p/DBQueryService
  (p/query [this qqname param-data options command-options]
    (apply (load-fun qqname) [(:tenant-conn this) (merge param-data authorised-uuid-tree)
                              options command-options]))
  (p/query [this qqname param-data options]
    (p/query this qqname param-data options nil))
  (p/query [this qqname param-data]
    (p/query this qqname param-data nil))
  (p/query [this qqname]
    (p/query this qqname nil)))

(defn new-dbqs
  "`authorised-uuid-tree`: {:auth-datasets [] :auth-visualisations [] :auth-dashboards [] :auth-collections []}"
  [tenant-conn authorised-uuid-tree]
  (AuthorisedDBQueryService. tenant-conn authorised-uuid-tree))

(defn wrap-auth-datasets
  "Add to the request the auth-datasets allowed to the current authenticated user,
  using flow-api check_permissions"
  [tenant-manager flow-api]
  (fn [handler]
    (fn [{:keys [jwt-claims tenant] :as request}]
      (log/debug :data ((:request-method request) (:data (rc/match-by-path (:reitit.core/router request)
                                                                     (:template (:reitit.core/match request))))))
      (log/debug :wrap-ds-auth [(:template (:reitit.core/match request)) (:request-method request)])
      (let [dss (all-datasets (p/connection tenant-manager tenant))
            _ (log/debug :all-datasets (map :id dss))
            request (if (let [t (:template (:reitit.core/match request))]
                          (or (= t "/api/datasets")
                              (= t "/api/library")))
                      (let [permissions (->> (map :source dss)
                                             (filter #(and (= (get % "instance") "uat1") (= "AKVO_FLOW" (get % "kind"))))
                                             (map c.flow/>api-model)
                                             (c.flow/check-permissions flow-api (jwt/jwt-token request))
                                             :body
                                             set)
                            
                            auth-datasets (->> dss
                                               (filter
                                                (fn [ds]
                                                  (let [source (:source ds)]
                                                    (if (= "AKVO_FLOW" (get source "kind"))
                                                      (contains? permissions (c.flow/>api-model source))
                                                      true))))
                                               (mapv :id))]
                        (assoc request
                               :auth-datasets auth-datasets
                               :db-query-service (new-dbqs (p/connection tenant-manager tenant)
                                                           {:auth-datasets auth-datasets})))
                      request)]
        (handler request)))))

(defmethod ig/init-key :akvo.lumen.lib.auth/wrap-auth-datasets  [_ {:keys [tenant-manager flow-api] :as opts}]
  (wrap-auth-datasets tenant-manager flow-api))

(defmethod ig/pre-init-spec :akvo.lumen.lib.auth/wrap-auth-datasets [_]
  ;; todo
  any?)
