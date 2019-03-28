(ns akvo.lumen.lib.auth
  (:require
   [akvo.commons.jwt :as jwt]
   [akvo.lumen.component.flow :as c.flow]
   [akvo.lumen.protocols :as p]
   [clojure.spec.alpha :as s]
   [clojure.tools.logging :as log]
   [hugsql.core :as hugsql]
   [integrant.core :as ig]
   ;; [ring.util.response :as response]
   ))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(def auth-calls {["/api/library"] {:methods #{:get}}})

(defn wrap-auth-datasets
  "Add to the request the auth-datasets allowed to the current authenticated user,
  using flow-api check_permissions"
  [tenant-manager flow-api]
  (fn [handler]
    (fn [{:keys [jwt-claims tenant] :as request}]
      (log/debug :wrap-ds-auth [(:template (:reitit.core/match request)) (:request-method request)])
      (let [dss (all-datasets (p/connection tenant-manager tenant))
            _ (log/debug :all-datasets (map :id dss))
            request (if (-> (get auth-calls [(:template (:reitit.core/match request))])
                            :methods
                            (contains? (:request-method request)))
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
                        (assoc request :auth-datasets auth-datasets))
                      request)]
        (handler request)))))

(defmethod ig/init-key :akvo.lumen.lib.auth/wrap-auth-datasets  [_ {:keys [tenant-manager flow-api] :as opts}]
 (wrap-auth-datasets tenant-manager flow-api))

(defmethod ig/pre-init-spec :akvo.lumen.lib.auth/wrap-auth-datasets [_]
  ;; todo
  any?)
