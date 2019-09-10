(ns akvo.lumen.component.keycloak
  "We leverage Keycloak groups for tenant partition and admin roles.
   More info can be found in the Keycloak integration doc spec."
  (:require
   [akvo.commons.jwt :as jwt]
   [akvo.lumen.http.client :as http.client]
   [akvo.lumen.lib :as lib]
   [akvo.lumen.monitoring :as monitoring]
   [akvo.lumen.protocols :as p]
   [cheshire.core :as json]
   [clojure.core.cache :as cache]
   [clojure.set :as set]
   [clojure.spec.alpha :as s]
   [clojure.tools.logging :as log]
   [clojure.walk :as w]
   [iapetos.core :as prometheus]
   [iapetos.registry :as registry]
   [integrant.core :as ig]
   [ring.util.response :refer [response]]))


(def ^:dynamic http-client-req-defaults (http.client/req-opts 5000))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helper fns
;;;

(defn fetch-openid-configuration
  "Get the openid configuration"
  [issuer req-opts]
  (let [url (format "%s/.well-known/openid-configuration" issuer)
        res (-> (http.client/get* url (merge http-client-req-defaults req-opts)) :body json/decode)]
    (log/info "Successfully got openid-config from provider.")
    res))

(defn get-roles [{:keys [api-root]} headers]
  (http.client/get* (format "%s/roles" api-root)
                     (merge
                      http-client-req-defaults
                      {:headers headers})))

(defn remove-group
  "Remove keycloak group by id"
  [{:keys [api-root]} headers id & [req-settings]]
  (log/error :remove-group :id id)
  (http.client/delete* (format "%s/groups/%s" api-root id)
                       (merge http-client-req-defaults
                              req-settings
                              {:headers headers
                               :as :json})))

(defn get-groups
  "List all keycloak groups and sub groups"
  [{:keys [api-root]} headers & [req-settings]]
  (:body (http.client/get* (format "%s/groups" api-root)
                           (merge http-client-req-defaults
                                  req-settings
                                  {:headers headers
                                   :as :json}))))

(defn remove-role-mappings [{:keys [api-root]} headers group-id & [req-settings]]
  (http.client/delete*
   (format "%s/groups/%s/role-mappings/realm" api-root group-id)
   (merge http-client-req-defaults
          req-settings
          {:headers headers})))

(defn remove-role [{:keys [api-root]} headers role-name & [req-settings]]
  (log/error :remove-role api-root role-name)
  (http.client/delete* (format "%s/roles/%s" api-root role-name )
                       (merge                        
                        http-client-req-defaults
                        req-settings
                        {:headers headers})))

(defn create-group
  [{:keys [api-root credentials openid-config]} headers root-group-id role group-name]
  (log/error :create-role :name role)
  (http.client/post* (format "%s/roles" api-root)
                     (merge
                      http-client-req-defaults
                      {:body (json/encode {"name" role})
                       :headers headers}))
  (let [new-group-id (-> (http.client/post*
                          (format "%s/groups/%s/children"
                                  api-root root-group-id)
                          (merge http-client-req-defaults
                                 {:body (json/encode {"name" group-name})
                                  :headers headers}))
                         :body json/decode (get "id"))
        _ (log/error :create-group :group-name group-name :new-group-id new-group-id)
        available-roles (-> (http.client/get*
                             (format "%s/groups/%s/role-mappings/realm/available"
                                     api-root root-group-id)
                             (merge http-client-req-defaults {:headers headers}))
                            :body json/decode)
        role-id (-> (filter #(= role (get % "name"))
                            available-roles)
                    first
                    (get "id"))
        pair-resp (http.client/post*
                   (format "%s/groups/%s/role-mappings/realm" api-root new-group-id)
                   (merge http-client-req-defaults
                          {:body (json/encode [{"id" role-id
                                                "name" role
                                                "scopeParamRequired" false
                                                "composite" false
                                                "clientRole" false
                                                "containerId" "Akvo"}])
                           :headers headers}))]
    (log/error :create-group :role-mappings :new-group-id new-group-id :role-id role-id :pair-resp pair-resp)
    new-group-id))

(defn update-client
  [{:keys [api-root]} headers {:strs [id] :as client} & [req-settings]]
  (http.client/put* (format "%s/clients/%s" api-root id)
                    (merge http-client-req-defaults
                           req-settings
                           {:body (json/encode client)
                            :headers headers})))

(defn fetch-client
  [{:keys [api-root]} headers client-id]
  (-> (http.client/get* (format "%s/clients" api-root)
                        (merge http-client-req-defaults
                               {:query-params {"clientId" client-id}
                                :headers headers}))
      :body json/decode first))

(defn request-headers
  "Create a set of request headers to use for interaction with the Keycloak
   REST API. This allows us to reuse the same token for multiple requests."
  ([{:keys [openid-config credentials connection-manager]}]
   (let [req-opts {:form-params        (merge {:grant_type "client_credentials"} credentials)
                   :connection-manager connection-manager}]
     (when-let [access-token (-> (http.client/post* (get openid-config "token_endpoint") (merge http-client-req-defaults
                                                                                                req-opts))
                                 :body
                                 json/decode
                                 (get "access_token"))]
       {"Authorization" (str "bearer " access-token)
        "Content-Type"  "application/json"}))))

(defn group-by-path
  "Get the group id (uuid) by using group path.

  For example:
    (group-by-path keycloak headers \"/akvo/lumen/t1/admin\") -> uuid"
  [{:keys [api-root credentials openid-config]} headers path]
  (let [path (if (some? path) (str "/" path) "")]
    (-> (http.client/get* (format "%s/group-by-path/%s" api-root (format "akvo/lumen%s" path))
                          (merge http-client-req-defaults
                                 {:headers headers}))
        :body json/decode)))

(defn root-group
  [{:keys [api-root credentials openid-config] :as data} headers]
  (group-by-path data headers nil))

(defn group-members
  "Return groups memebers using a group id"
  [{:keys [api-root credentials openid-config]} headers group-id]
  (-> (http.client/get* (format "%s/groups/%s/members"
                         api-root group-id)
                        (merge http-client-req-defaults
                               {:headers headers}))
      :body json/decode))

(defn tenant-members
  "Return the users for a tenant. The tenant label here becomes the group-name"
  [keycloak tenant-label]
  (try
    (let [headers         (request-headers keycloak)
          tenant-group    (group-by-path keycloak headers tenant-label)
          group-id        (get tenant-group "id")
          users           (map #(assoc % "admin" false)
                               (group-members keycloak headers group-id))
          admin-group-id  (get (first (filter #(= "admin"
                                                  (get % "name"))
                                              (get-in tenant-group ["subGroups"])))
                               "id")
          admins          (map #(assoc % "admin" true)
                               (group-members keycloak headers admin-group-id))
          members         (filter #(and (get % "emailVerified") (get % "enabled"))
                                  (concat admins users))
          response-filter ["admin" "email" "firstName" "id" "lastName"
                           "username"]]
      (lib/ok {:users (map #(select-keys % response-filter) members)}))
    (catch clojure.lang.ExceptionInfo e
      (let [ed (ex-data e)]
        ;; TODO??
        (response {:status (:status ed)
                   :body   (:reasonPhrase ed)})))))

(defn tenant-admin?
  [headers api-root tenant user-id]
  (let [admin-group-id (-> (http.client/get* (format "%s/group-by-path/akvo/lumen/%s/admin"
                                              api-root tenant)
                                             (merge http-client-req-defaults
                                                    {:headers headers}))
                           :body json/decode (get "id"))
        admins         (-> (http.client/get* (format "%s/groups/%s/members" api-root admin-group-id)
                                             (merge http-client-req-defaults
                                                    {:headers headers}))
                           :body json/decode)
        admin-ids      (into #{}
                             (map #(get % "id"))
                             (filter #(and (get % "emailVerified")
                                           (get % "enabled"))
                                     admins))]
    (contains? (set admin-ids) user-id)))

(defn fetch-user-by-id
  "Get user by email. Returns nil if not found."
  [headers api-root tenant user-id]
  (let [resp (-> (http.client/get* (format "%s/users/%s" api-root user-id)
                                   (merge http-client-req-defaults
                                          {:headers headers}))
                 :body json/decode)]
    (assoc resp
           "admin"
           (tenant-admin? headers api-root tenant user-id))))

(defn fetch-user-by-email
  "Get user by email. Returns nil if none found."
  [headers api-root email]
  (let [candidates (-> (http.client/get* (format "%s/users?email=%s"
                                          api-root email)
                                         (merge http-client-req-defaults
                                                {:headers headers}))
                       :body json/decode)]
    ;; Since the keycloak api does a search and not a key lookup on the email
    ;; we need make sure that we have an exact match
    (first (filter (fn [candidate]
                     (= (get candidate "email") email))
                   candidates))))

(defn fetch-user-groups
  "Get the groups of the user"
  [headers api-root user-id]
  (-> (http.client/get* (format "%s/users/%s/groups" api-root user-id)
                        (merge http-client-req-defaults
                               {:headers headers}))
      :body json/decode))

(defn tenant-member?
  "Return true for both members and admins."
  [{:keys [api-root] :as keycloak} tenant email]
  (let [headers (request-headers keycloak)]
    (if-let [user-id
             (get (fetch-user-by-email headers api-root email) "id")]
      (let [possible-group-paths (set (map #(format % tenant)
                                           ["/akvo/lumen/%s" "/akvo/lumen/%s/admin"]))
            user-groups          (fetch-user-groups headers api-root user-id)
            user-group-paths     (reduce (fn [path-set group]
                                           (conj path-set (get group "path")))
                                         #{}
                                         user-groups)]
        (not (empty? (set/intersection possible-group-paths user-group-paths))))
      false)))

(defn add-user-to-group
  "Returns status code from Keycloak response."
  [headers api-root user-id group-id]
  (:status (http.client/put* (format "%s/users/%s/groups/%s"
                              api-root user-id group-id)
                             (merge http-client-req-defaults
                                    {:headers headers}))))

(defn remove-user-from-group
  "Returns status code from Keycloak response."
  [headers api-root user-id group-id]
  (:status (http.client/delete* (format "%s/users/%s/groups/%s"
                                 api-root user-id group-id)
                                (merge http-client-req-defaults
                                       {:headers headers}))))

(defn change-user-representation
  "Returns status code from Keycloak response."
  [headers api-root user-id payload]
  (http.client/put* (format "%s/users/%s" api-root user-id)
                    (merge http-client-req-defaults
                           {:headers headers
                            :body    (json/encode payload)})))

(defn patch-names
  [headers api-root user-id first-name last-name]
  (:status (change-user-representation headers api-root user-id
                                       {"firstName" first-name
                                        "lastName" last-name})))

(defn set-user-have-verified-email
  "Returns status code from Keycloak response."
  [headers api-root user-id ]
  (:status (change-user-representation headers api-root user-id {"emailVerified" true})))

(defn do-promote-user-to-admin
  [{:keys [api-root] :as keycloak} tenant author-claims user-id]
  (if (= (get author-claims "sub") user-id)
    (lib/bad-request {"reason" "Tried to alter own tenant role"})
    (let [headers         (request-headers keycloak)
          tenant-group-id (get (group-by-path
                                keycloak headers tenant) "id")
          admin-group-id  (get (group-by-path
                                keycloak headers
                                (format "%s/admin" tenant)) "id")]
      (if (and (= 204 (add-user-to-group headers api-root user-id
                                         admin-group-id))
               (= 204 (remove-user-from-group headers api-root user-id
                                              tenant-group-id)))
        (lib/ok (fetch-user-by-id headers api-root tenant user-id))
        (do
          (println (format "Tried to promote user: %s" user-id))
          (lib/internal-server-error {}))))))

(defn do-demote-user-from-admin
  [{:keys [api-root] :as keycloak} tenant author-claims user-id]
  (if (= (get author-claims "sub") user-id)
    (lib/bad-request {"reason" "Tried to alter own tenant role"})
    (let [headers         (request-headers keycloak)
          tenant-group-id (get (group-by-path keycloak headers tenant)
                               "id")
          admin-group-id  (get (group-by-path keycloak headers
                                              (format "%s/admin" tenant))
                               "id")]
      (if (and (= 204 (remove-user-from-group headers api-root user-id
                                              admin-group-id))
               (= 204 (add-user-to-group headers api-root user-id
                                         tenant-group-id)))
        (lib/ok (fetch-user-by-id headers api-root tenant user-id))
        (do
          (println (format "Tried to demote user: %s" user-id))
          (lib/internal-server-error {}))))))

(defn change-names
  [{:keys [api-root] :as keycloak} tenant claims user-id first-name last-name]
  (let [headers (request-headers keycloak)
        keycloak-user (fetch-user-by-id headers api-root tenant user-id)
        keycloak-user-email (get keycloak-user "email")
        claims-user-email (get claims "email")]
    (if (= keycloak-user-email claims-user-email)
      (if (= (patch-names headers api-root user-id first-name last-name) 204)
        (lib/ok (fetch-user-by-id headers api-root tenant user-id))
        (let [log-data {:jwt-claims-email claims-user-email
                        :keycloak-user-email keycloak-user-email
                        :tenant tenant
                        :user user-id}]
          (log/error ::change-names-email-missmatch
                     "Email from Keycloak and JWT claims did not match" log-data)
          (lib/bad-request {:id user-id
                            :error "Could not update name"})))
      (lib/not-authorized {:id user-id
                           :message "Email missmatch"}))))

(defn do-remove-user
  [{:keys [api-root] :as keycloak} tenant author-claims user-id]
  (if (= (get author-claims "sub") user-id)
    (lib/bad-request {"reason" "Tried to alter own tenant role"})
    (let [headers         (request-headers keycloak)
          tenant-group-id (get (group-by-path keycloak headers tenant)
                               "id")
          admin-group-id  (get (group-by-path keycloak headers
                                              (format "%s/admin" tenant))
                               "id")]
      (if (and (= 204 (remove-user-from-group headers api-root user-id
                                              admin-group-id))
               (= 204 (remove-user-from-group headers api-root user-id
                                              tenant-group-id)))
        (lib/ok {})
        (do
          (println (format "Tried to remove user: %s" user-id))
          (lib/internal-server-error {}))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; API Authorization
;;;

(defn- active-user [users email]
  (-> (filter #(and (= (get % "email") email)
                    (get % "enabled"))
              users)
      first
      (get "id")))

(defn- get-user-id [user-id-cache email]
  (when-let [user-id (get @user-id-cache email)]
    (swap! user-id-cache cache/hit email)
    user-id))

(defn- lookup-user-id
  "Lookup email -> Keycloak user-id, via cached Keycloak API."
  [req-opts api-root user-id-cache email]
  (if-let [user-id (get-user-id user-id-cache email)]
    user-id
    (when-let [user-id (-> (http.client/get* (format "%s/users/?email=%s" api-root email) (merge http-client-req-defaults
                                                                                                 req-opts))
                           :body
                           json/decode
                           (active-user email))]
      (-> user-id-cache
          (swap! assoc email user-id)
          (get email)))))

(defn- allowed-paths
  "Provided an email address from the authentication process dig out the
  Keycloak user and get allowed set of paths, as in #{\"demo/admin\" \"t1\"}

  The Keycloak groups are on the form /akvo/lumen/demo/admin, to simplify  we
  remove the leading /akvo/lumen and return paths as demo/admin."
  [{:keys [api-root user-id-cache connection-manager monitoring] :as keycloak} email]
  (prometheus/with-duration (registry/get (:collector monitoring) :app/auth-allowed-paths {})
    (when-let [headers (request-headers keycloak)]
      (let [req-opts {:headers headers :connection-manager connection-manager}]
        (when-let [user-id (lookup-user-id req-opts api-root user-id-cache email)]
          (->> (http.client/get* (format "%s/users/%s/groups" api-root user-id) (merge http-client-req-defaults
                                                                                       req-opts))
               :body
               json/decode
               (reduce (fn [paths {:strs [path]}]
                         (conj paths (subs path 12)))
                       #{})))))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; KeycloakAgent Component
;;;

(defrecord KeycloakAgent [api-root credentials user-id-cache]
  p/UserManagement
  (add-user-with-email [{:keys [api-root] :as keycloak} tenant-label email]
    (let [headers  (request-headers keycloak)
          user-id  (get (fetch-user-by-email headers api-root email)
                        "id")
          group-id (get (group-by-path keycloak headers tenant-label)
                        "id")]
      (and (= 204 (add-user-to-group
                   headers api-root user-id group-id))
           (= 204 (set-user-have-verified-email
                   headers api-root user-id)))))

  (create-user [{:keys [api-root]} headers email]
    (http.client/post* (format "%s/users" api-root)
                       (merge http-client-req-defaults
                              {:body    (json/encode
                                         {"username" email
                                          "email" email
                                          "emailVerified" false
                                          "enabled" true})
                               :headers headers})))

  (demote-user-from-admin
    [this tenant author-claims user-id]
    (do-demote-user-from-admin this tenant author-claims user-id))

  (promote-user-to-admin
    [this tenant author-claims user-id]
    (do-promote-user-to-admin this tenant author-claims user-id))

  (change-names
    [this tenant author-claims user-id first-name last-name]
    (change-names this tenant author-claims user-id first-name last-name))

  (reset-password [{:keys [api-root]} headers user-id tmp-password]
    (http.client/put* (format "%s/users/%s/reset-password" api-root user-id)
                      (merge http-client-req-defaults
                             {:body (json/encode {"temporary" true
                                                  "type" "password"
                                                  "value" tmp-password})
                              :headers headers})))

  (remove-user
    [this tenant author-claims user-id]
    (do-remove-user this tenant author-claims user-id))

  (user [keycloak tenant email]
    (let [headers (request-headers keycloak)
          user-id (get (fetch-user-by-email headers (:api-root keycloak) email) "id")]
      (w/keywordize-keys (fetch-user-by-id headers (:api-root keycloak) tenant user-id))))

  (user? [keycloak email]
    (let [headers (request-headers keycloak)]
      (not (nil? (fetch-user-by-email headers
                                      (:api-root keycloak)
                                      email)))))

  (users [this tenant-label]
    (tenant-members this tenant-label))

  p/Authorizer
  (allowed-paths [this email]
    (allowed-paths this email)))

(defn- init-keycloak [{:keys [credentials url realm max-user-ids-cache]}]
  (map->KeycloakAgent {:api-root      (format "%s/admin/realms/%s" url realm)
                       :credentials   credentials
                       :user-id-cache (atom (cache/lru-cache-factory {} :threshold max-user-ids-cache))}))

(defmethod ig/init-key :akvo.lumen.component.keycloak/public-client  [_ {:keys [url realm] :as opts}]
  (try
    (let [issuer (str url "/realms/" realm)
          rsa-key (-> (str issuer "/protocol/openid-connect/certs")
                      (http.client/get* http-client-req-defaults)
                      :body
                      (jwt/rsa-key 0))]
      (assoc opts
             :issuer issuer
             :rsa-key rsa-key))
    (catch Exception e
      (log/error e "Could not get cert from Keycloak")
      (throw e))))

(s/def ::url string?)
(s/def ::client-id string?)
(s/def ::realm string?)

(s/def ::public-client (s/keys :req-un [::url
                                        ::realm
                                        ::client-id]))

(defmethod ig/pre-init-spec :akvo.lumen.component.keycloak/public-client [_]
  ::public-client)

(defmethod ig/init-key :akvo.lumen.component.keycloak/authorization-service  [_ {:keys [credentials public-client max-user-ids-cache monitoring] :as opts}]
  (log/info "Starting keycloak")
  (assoc (init-keycloak (assoc public-client :credentials credentials :max-user-ids-cache max-user-ids-cache))
         :connection-manager (http.client/new-connection-manager {:timeout 10 :threads 10 :default-per-route 10})
         :openid-config (fetch-openid-configuration (:issuer public-client) {})
         :monitoring monitoring))

(def map-print-method
  (get-method clojure.core/print-method clojure.lang.PersistentArrayMap))

(defmethod clojure.core/print-method KeycloakAgent
  [ka ^java.io.Writer writer]
  (.write writer (map-print-method (update ka :openid-config #(hash-map :issuer (get % "issuer"))) writer)))


(defmethod ig/halt-key! :akvo.lumen.component.keycloak/authorization-service  [_ opts]
  (log/info :keycloak "closing connection manager" (:connection-manager opts))
  (http.client/shutdown-manager (:connection-manager opts)))


(s/def ::client_id string?)
(s/def ::client_secret string?)

(s/def ::credentials (s/keys :req-un [::client_id
                                      ::client_secret]))

(s/def ::max-user-ids-cache pos-int?)
(s/def ::monitoring (s/keys :req-un [::monitoring/collector]))
(s/def ::config (s/keys :req-un [::public-client ::credentials ::max-user-ids-cache ::monitoring]))

(defmethod ig/pre-init-spec :akvo.lumen.component.keycloak/authorization-service [_]
  ::config)


(defmethod clojure.core/print-method sun.security.rsa.RSAPublicKeyImpl
  [system ^java.io.Writer writer]
  (.write writer "#<RSAPublicKey>"))
