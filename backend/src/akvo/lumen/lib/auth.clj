(ns akvo.lumen.lib.auth
  (:require
   [akvo.commons.jwt :as jwt]
   [akvo.lumen.component.flow :as c.flow]
   [akvo.lumen.component.tenant-manager :as tenant-manager]
   [akvo.lumen.protocols :as p]
   [clojure.spec.alpha :as s]
   [clojure.string :as str]
   [clojure.tools.logging :as log]
   [hugsql.core :as hugsql]
   [integrant.core :as ig]
   [reitit.core :as rc]))

(defrecord AuthorisedDBQueryService [tenant-conn authorised-uuid-tree]
  p/DBQueryService
  (p/get-conn [this]
    (:tenant-conn this))
  (p/query [this fun param-data options command-options]
    (log/info :AuthorisedDBQueryService :query fun :param-data param-data :options options :command-options command-options :authorised-uuid-tree authorised-uuid-tree)
    (apply fun [(:tenant-conn this) (merge param-data authorised-uuid-tree)
                options command-options]))
  (p/query [this fun param-data options]
    (p/query this fun param-data options nil))
  (p/query [this fun param-data]
    (p/query this fun param-data nil))
  (p/query [this fun]
    (p/query this fun nil)))

(defn new-dbqs
  "`authorised-uuid-tree`: {:auth-datasets [] :auth-visualisations [] :auth-dashboards [] :auth-collections []}"
  [tenant-conn authorised-uuid-tree]
  (AuthorisedDBQueryService. tenant-conn authorised-uuid-tree))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defn match-by-jwt-family-name?
  "Feature flag condition based on `First Name` jwt-claims
  To match just add `$auth` to your `First Name` in your related auth system user profile"
  [request]
  (str/includes? (get (:jwt-claims request) "given_name") "$auth$"))

(defn match-by-template-and-method?
  "`data` is a map following this structure {\"/api/library\" {:methods #{:get}}}
  `request` is a `reitit` request that contains reitit data such as :template"
  [data request]
  (-> (get data (:template (:reitit.core/match request)))
      :methods
      (contains? (:request-method request))))

(def auth-calls {"/api/library" {:methods #{:get}}
                 "/api/datasets/:id" {:methods #{:get :put :delete}}
                 "/api/datasets/:id/meta" {:methods #{:get}}
                 "/api/datasets/:id/update" {:methods #{:post}}
                 "/api/datasets" {:methods #{:get}}})

(defn- auth-datasets [all-datasets permissions]
  (->> all-datasets
       (filter
        (fn [ds]
          (let [source (:source ds)]
            (if (= "AKVO_FLOW" (get source "kind"))
              (contains? permissions (c.flow/>api-model source))
              true))))
       (mapv :id)))

(defn wrap-auth-datasets
  "Add to the request a db-query-service with a authorised-uuid-tree validated using flow-api check_permissions"
  [tenant-manager flow-api]
  (fn [handler]
    (fn [{:keys [jwt-claims tenant] :as request}]
      (let [dss            (all-datasets (p/connection tenant-manager tenant))
            auth-uuid-tree (if (and (match-by-jwt-family-name? request)
                                    (match-by-template-and-method? auth-calls request))
                             (let [permissions   (->> (map :source dss)
                                                      (filter #(and (= (get % "instance") "uat1") (= "AKVO_FLOW" (get % "kind"))))
                                                      (map c.flow/>api-model)
                                                      (c.flow/check-permissions flow-api (jwt/jwt-token request))
                                                      :body
                                                      set)
                                   auth-datasets (auth-datasets dss permissions)]
                               {:auth-datasets auth-datasets})
                             {})]
        (handler (assoc request
                        :db-query-service
                        (new-dbqs (p/connection tenant-manager tenant)
                                  auth-uuid-tree)))))))

(defmethod ig/init-key :akvo.lumen.lib.auth/wrap-auth-datasets  [_ {:keys [tenant-manager flow-api] :as opts}]
  (wrap-auth-datasets tenant-manager flow-api))

(s/def ::flow-api ::c.flow/config)

(defmethod ig/pre-init-spec :akvo.lumen.lib.auth/wrap-auth-datasets [_]
  (s/keys :req-un [::tenant-manager/tenant-manager
                   ::flow-api]))
