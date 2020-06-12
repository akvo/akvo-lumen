(ns akvo.lumen.lib.auth
  (:require
   [akvo.commons.jwt :as jwt]
   [akvo.lumen.component.authz-service :as c.authz]
   [akvo.lumen.component.tenant-manager :as tenant-manager]
   [akvo.lumen.db.collection :as db.collection]
   [akvo.lumen.db.dashboard :as db.dashboard]
   [akvo.lumen.db.dataset :as db.dataset]
   [akvo.lumen.db.raster :as db.raster]
   [akvo.lumen.db.visualisation :as db.visualisation]
   [akvo.lumen.monitoring :as monitoring]
   [akvo.lumen.protocols :as p]
   [akvo.lumen.specs :as lumen.s]
   [akvo.lumen.specs.collection :as collection.s]
   [akvo.lumen.specs.dashboard :as dashboard.s]
   [akvo.lumen.specs.dataset :as dataset.s]
   [akvo.lumen.specs.visualisation :as visualisation.s]
   [clojure.set :as set]
   [clojure.spec.alpha :as s]
   [clojure.string :as str]
   [clojure.tools.logging :as log]
   [clojure.walk :as w]
   [iapetos.core :as prometheus]
   [iapetos.registry :as registry]
   [integrant.core :as ig]))

(declare ids)

(defn- allow?* [this ids]
  {:pre [(= #{:dataset-ids :visualisation-ids :dashboard-ids :collection-ids}
            (set (keys ids)))]}
  (and (set/subset? (:visualisation-ids ids) (:auth-visualisations-set this))
       (set/subset? (:dataset-ids ids) (:auth-datasets-set this))
       (set/subset? (:dashboard-ids ids) (:auth-dashboards-set this))
       (set/subset? (:collection-ids ids) (:auth-collections-set this))))

(defn- auth* [this ids]
  {:pre [(= #{:dataset-ids :visualisation-ids :dashboard-ids :collection-ids}
            (set (keys ids)))]}
  {:auth-datasets       (set/intersection (:auth-datasets-set this) (set (:dataset-ids ids)))
   :auth-visualisations (set/intersection (:auth-visualisations-set this) (set (:visualisation-ids ids)))
   :auth-dashboards     (set/intersection (:auth-dashboards-set this) (set (:dashboard-ids ids)))
   :auth-collections    (set/intersection (:auth-collections-set this) (set (:collections-ids ids)))})

(defrecord AuthServiceImpl [auth-datasets-set auth-visualisations-set auth-dashboards-set auth-collections-set rasters-set]
  p/AuthService
  (allow? [this ids]
    (allow?* this ids))
  (auth [this ids]
    (auth* this ids))
  (auth [this type* uuid]
    (let [f* (fn [s u] (when (contains? s u) u))]
      (condp = type*
        :dataset       (f* auth-datasets-set uuid)
        :visualisation (f* auth-visualisations-set uuid)
        :dashboard     (f* auth-dashboards-set uuid)
        :collection    (f* auth-collections-set uuid)))))

(defn new-auth-service [{:keys [auth-datasets auth-visualisations auth-dashboards auth-collections rasters] :as auth-uuid-tree}]
  (AuthServiceImpl. (set auth-datasets) (set auth-visualisations) (set auth-dashboards) (set auth-collections) (set rasters)))

(defn match-by-jwt-family-name?
  "Feature flag condition based on `First Name` jwt-claims
  To match just add `$auth` to your `First Name` in your related auth system user profile"
  [request]
  (str/includes? (get (:jwt-claims request) "given_name" "") "$auth$"))

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
                 "/api/datasets/:id/group/:group-id" {:methods #{:get}}
                 "/api/datasets/:id/sort/:column-name/text" {:methods #{:get}}
                 "/api/datasets/:id/sort/:column-name/number" {:methods #{:get}}
                 "/api/datasets" {:methods #{:get}}
                 "/api/visualisations" {:methods #{:get :post}}
                 "/api/visualisations/:id" {:methods #{:get :put :delete}}
                 "/api/visualisations/maps" {:methods #{:post}}
                 "/api/dashboards" {:methods #{:get :post}}
                 "/api/dashboards/:id" {:methods #{:get :put :delete}}
                 "/api/collections" {:methods #{:get :post}}
                 "/api/collections/:id" {:methods #{:get :put :delete}}})

(defn- auth-datasets [all-datasets permissions]
  (->> all-datasets
       (filter
        (fn [ds]
          (let [source (:source ds)]
            (if (= "AKVO_FLOW" (get source "kind"))
              (contains? permissions (c.authz/>api-model source))
              true))))
       (mapv :id)))

(defn- auth-visualisations [tenant-conn auth-datasets-set]
  (let [all-visualisations (w/keywordize-keys (db.visualisation/all-visualisations-slim
                                               tenant-conn {} {} {:identifiers identity}))
        maps (filter #(= "map" (:visualisationType %)) all-visualisations)
        nomaps (filter #(not= "map" (:visualisationType %)) all-visualisations)
        maps*         (->> maps
                           (reduce (fn [c m]
                                     (let [datasets (reduce (fn [c l]
                                                              (if-let [ds (let [ds (:datasetId l)]
                                                                            (and ds (not= "null" ds)))]
                                                                (conj c ds)
                                                                c)) #{} (:layers m))]
                                       (conj c {:id       (:id m)
                                                :datasets datasets}))) [])
                           (filter (fn [{:keys [id datasets]}]
                                     (set/superset? auth-datasets-set datasets)))
                           (mapv :id))
        nomaps*       (mapv :id (->> nomaps
                                     (filter #(or (contains? auth-datasets-set (:datasetId %))
                                                  (nil? (:datasetId %))))))]
    (log/debug :vis-maps* maps*)
    (log/debug :vis-others* nomaps*)
    (apply conj nomaps* maps*)))

(defn- auth-dashboards [tenant-conn auth-visualisations-set]
  (->> (db.dashboard/all-dashboards-with-visualisations tenant-conn {} {} {:identifiers identity})
               (group-by :id)
               (reduce (fn [c [i col*]]
                   (conj c (-> (first col*)
                               (assoc  :visualisations (mapv :visualisationId col*))
                               (dissoc :visualisationId)))) '())
               (filter (fn [d]
                         (set/subset? (:visualisation-ids (ids ::dashboard.s/dashboard d))
                                      auth-visualisations-set)))
               (mapv :id)))

(defn- auth-collections [tenant-conn auth-datasets auth-visualisations auth-dashboards]
  (mapv :id (db.collection/auth-collection-ids tenant-conn
                                 {:dataset-ids auth-datasets
                                  :visualisation-ids auth-visualisations
                                  :dashboard-ids auth-dashboards})))

(defn- user-identity [request]
  {:email (get-in request [:jwt-claims "email"])
   :token (jwt/jwt-token request)})

(defn- flow-check-permissions [authz-service-client request collector tenant data]
  (prometheus/with-duration (registry/get collector :app/flow-check-permissions {"tenant" tenant})
    (p/check-permissions authz-service-client (user-identity request) data)))

(defn- load-auth-data [dss rasters tenant-conn authz-service-client request collector tenant]
  (prometheus/with-duration (registry/get collector :app/load-auth-data {"tenant" tenant})
    (let [permissions         (let [flow-data (->> (map :source dss)
                                                   (filter #(= "AKVO_FLOW" (get % "kind")))
                                                   (map c.authz/>api-model)
                                                   (into #{})
                                                   vec)]
                                (if (seq flow-data)
                                  (->> flow-data
                                       (flow-check-permissions authz-service-client request collector tenant)
                                       :body
                                       set)
                                  #{}))
          auth-datasets (->> (auth-datasets dss permissions)
                             (prometheus/with-duration
                               (registry/get collector :app/auth-datasets {"tenant" tenant})))

          auth-visualisations (->> (auth-visualisations tenant-conn (set auth-datasets))
                                   (prometheus/with-duration
                                     (registry/get collector :app/auth-visualisations {"tenant" tenant})))

          auth-dashboards (->> (auth-dashboards tenant-conn (set auth-visualisations))
                               (prometheus/with-duration
                                 (registry/get collector :app/auth-dashboards {"tenant" tenant})))

          auth-collections (->> (auth-collections tenant-conn auth-datasets auth-visualisations auth-dashboards)
                                (prometheus/with-duration
                                  (registry/get collector :app/auth-collections {"tenant" tenant})))]
      {:rasters             rasters
       :auth-datasets       auth-datasets
       :auth-visualisations auth-visualisations
       :auth-dashboards     auth-dashboards
       :auth-collections    auth-collections})))

(defn wrap-auth-datasets
  "Add to the request an auth-service protocol impl using flow-api check_permissions"
  [tenant-manager authz-service-client collector]
  (fn [handler]
    (fn [{:keys [tenant] :as request}]
      (if-not (match-by-template-and-method? auth-calls request)
        (handler request)
        (let [tenant-conn    (p/connection tenant-manager tenant)
              dss            (db.dataset/all-datasets tenant-conn)
              rasters        (mapv :id (db.raster/all-rasters tenant-conn))
              auth-uuid-tree (if (match-by-jwt-family-name? request)
                               (load-auth-data dss rasters tenant-conn authz-service-client request collector tenant)
                               (do
                                 (future
                                   (load-auth-data dss rasters tenant-conn authz-service-client request collector tenant))
                                 {:rasters             rasters
                                  :auth-datasets       (mapv :id dss)
                                  :auth-visualisations (mapv :id (db.visualisation/all-visualisations-ids tenant-conn))
                                  :auth-dashboards     (mapv :id (db.dashboard/all-dashboards-ids tenant-conn))
                                  :auth-collections    (mapv :id (db.collection/all-collections-ids tenant-conn))}))]
          (handler (assoc request
                          :auth-service (new-auth-service auth-uuid-tree))))))))

(defmethod ig/init-key :akvo.lumen.lib.auth/wrap-auth-datasets  [_ {:keys [tenant-manager authz-service-client monitoring] :as opts}]
  (wrap-auth-datasets tenant-manager authz-service-client (:collector monitoring)))

(s/def ::monitoring (s/keys :req-un [::monitoring/collector]))

(defmethod ig/pre-init-spec :akvo.lumen.lib.auth/wrap-auth-datasets [_]
  (s/keys :req-un [::tenant-manager/tenant-manager
                   ::c.authz/authz-service-client
                   ::monitoring]))

(defn ids
  "returns `{:dataset-ids #{id...} :dashboard-ids #{id...} :visualisation-ids #{id...} :collection-ids #{id...}}` found in `data` arg. Logic based on clojure.spec/def `spec`
   Based on dynamic thread binding."
  [spec data]
  (let [ids    (atom {:collection-ids    #{}
                      :dashboard-ids     #{}
                      :dataset-ids       #{}
                      :visualisation-ids #{}})
        add-id (fn [k id]
                 (when id
                   (swap! ids update k conj id)))]
    (binding [collection.s/*id?*    (partial add-id :collection-ids)
              dashboard.s/*id?*     (partial add-id :dashboard-ids)
              dataset.s/*id?*       (partial add-id :dataset-ids)
              visualisation.s/*id?* (partial add-id :visualisation-ids)]
      (s/explain-str spec data)
      (deref ids))))
