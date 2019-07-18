(ns akvo.lumen.component.keycloak
  "We leverage Keycloak groups for tenant partition and admin roles.
   More info can be found in the Keycloak integration doc spec."
  (:require
   [akvo.commons.jwt :as jwt]
   [akvo.lumen.lib :as lib]
   [akvo.lumen.protocols :as p]
   [cheshire.core :as json]
   [clj-http.client :as client]
   [clj-http.conn-mgr :as http.conn-mgr]
   [clojure.core.cache :as cache]
   [clojure.set :as set]
   [clojure.spec.alpha :as s]
   [clojure.tools.logging :as log]
   [integrant.core :as ig]
   [ring.util.response :refer [response]]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helper fns
;;;

(defn fetch-openid-configuration
  "Get the openid configuration"
  ([issuer]
   (fetch-openid-configuration issuer {}))
  ([issuer req-opts]
   (let [url (format "%s/.well-known/openid-configuration" issuer)]
     (-> (client/get url req-opts) :body json/decode))))

(defn request-headers
  "Create a set of request headers to use for interaction with the Keycloak
   REST API. This allows us to reuse the same token for multiple requests."
  ([{:keys [openid-config credentials connection-manager] :as k}]
   (request-headers k {}))
  ([{:keys [openid-config credentials connection-manager]}
    {:keys [timeout] :as req-opts}]
   (let [params (merge {:grant_type "client_credentials"} credentials)
         req-opts (-> (select-keys req-opts [:timeout])
                      (assoc :form-params params :connection-manager connection-manager))]
     (when-let [access-token (-> (client/post (get openid-config "token_endpoint") req-opts)
                                 :body
                                 json/decode
                                 (get "access_token"))]
       {"Authorization" (str "bearer " access-token)
        "Content-Type" "application/json"}))))

(defn group-by-path
  "Get the group id (uuid) by using group path.

  For example:
    (group-by-path keycloak headers \"/akvo/lumen/t1/admin\") -> uuid"
  [{:keys [api-root credentials openid-config]} headers path]
  (-> (client/get (format "%s/group-by-path/%s"
                          api-root (format "akvo/lumen/%s" path))
                  {:headers headers})
      :body json/decode))

(defn group-members
  "Return groups memebers using a group id"
  [{:keys [api-root credentials openid-config]} headers group-id]
  (-> (client/get (format "%s/groups/%s/members"
                          api-root group-id)
                  {:headers headers})
      :body json/decode))

(defn tenant-members
  "Return the users for a tenant. The tenant label here becomes the group-name"
  [keycloak tenant-label]
  (try
    (let [headers (request-headers keycloak)
          tenant-group (group-by-path keycloak headers tenant-label)
          group-id (get tenant-group "id")
          users  (map #(assoc % "admin" false)
                      (group-members keycloak headers group-id))
          admin-group-id (get (first (filter #(= "admin"
                                                 (get % "name"))
                                             (get-in tenant-group ["subGroups"])))
                              "id")
          admins (map #(assoc % "admin" true)
                      (group-members keycloak headers admin-group-id))
          members (filter #(and (get % "emailVerified") (get % "enabled"))
                          (concat admins users))
          response-filter ["admin" "email" "firstName" "id" "lastName"
                           "username"]]
      (lib/ok {:users (map #(select-keys % response-filter) members)}))
    (catch clojure.lang.ExceptionInfo e
      (let [ed (ex-data e)]
        ;; TODO??
        (response {:status (:status ed)
                   :body (:reasonPhrase ed)})))))

(defn tenant-admin?
  [headers api-root tenant user-id]
  (let [admin-group-id (-> (client/get (format "%s/group-by-path/akvo/lumen/%s/admin"
                                               api-root tenant)
                                       {:headers headers})
                           :body json/decode (get "id"))
        admins (-> (client/get (format "%s/groups/%s/members" api-root admin-group-id)
                               {:headers headers})
                   :body json/decode)
        admin-ids (into #{}
                        (map #(get % "id"))
                        (filter #(and (get % "emailVerified")
                                      (get % "enabled"))
                                admins))]
    (contains? (set admin-ids) user-id)))

(defn fetch-user-by-id
  "Get user by email. Returns nil if not found."
  [headers api-root tenant user-id]
  (let [resp (-> (client/get (format "%s/users/%s" api-root user-id)
                             {:headers headers})
                 :body json/decode)]
    (assoc resp
           "admin"
           (tenant-admin? headers api-root tenant user-id))))

(defn fetch-user-by-email
  "Get user by email. Returns nil if none found."
  [headers api-root email]
  (let [candidates (-> (client/get (format "%s/users?email=%s"
                                           api-root email)
                                   {:headers headers})
                       :body json/decode)]
    ;; Since the keycloak api does a search and not a key lookup on the email
    ;; we need make sure that we have an exact match
    (first (filter (fn [candidate]
                     (= (get candidate "email") email))
                   candidates))))

(defn fetch-user-groups
  "Get the groups of the user"
  [headers api-root user-id]
  (-> (client/get (format "%s/users/%s/groups" api-root user-id)
                  {:headers headers})
      :body json/decode))

(defn tenant-member?
  "Return true for both members and admins."
  [{:keys [api-root] :as keycloak} tenant email]
  (let [headers (request-headers keycloak)]
    (if-let [user-id
             (get (fetch-user-by-email headers api-root email) "id")]
      (let [possible-group-paths (set (map #(format % tenant)
                                           ["/akvo/lumen/%s" "/akvo/lumen/%s/admin"]))
            user-groups (fetch-user-groups headers api-root user-id)
            user-group-paths (reduce (fn [path-set group]
                                       (conj path-set (get group "path")))
                                     #{}
                                     user-groups)]
        (not (empty? (set/intersection possible-group-paths user-group-paths))))
      false)))

(defn add-user-to-group
  "Returns status code from Keycloak response."
  [headers api-root user-id group-id]
  (:status (client/put (format "%s/users/%s/groups/%s"
                               api-root user-id group-id)
                       {:headers headers})))

(defn remove-user-from-group
  "Returns status code from Keycloak response."
  [headers api-root user-id group-id]
  (:status (client/delete (format "%s/users/%s/groups/%s"
                                  api-root user-id group-id)
                          {:headers headers})))

(defn set-user-have-verified-email
  "Returns status code from Keycloak response."
  [headers api-root user-id]
  (:status (client/put (format "%s/users/%s" api-root user-id)
                       {:body (json/encode {"emailVerified" true})
                        :headers headers})))

(defn do-promote-user-to-admin
  [{:keys [api-root] :as keycloak} tenant author-claims user-id]
  (if (= (get author-claims "sub") user-id)
    (lib/bad-request {"reason" "Tried to alter own tenant role"})
    (let [headers (request-headers keycloak)
          tenant-group-id (get (group-by-path
                                keycloak headers tenant) "id")
          admin-group-id (get (group-by-path
                               keycloak headers
                               (format "%s/admin" tenant)) "id")]
      (if (and (= 204 (add-user-to-group headers api-root user-id
                                         admin-group-id))
               (= 204 (remove-user-from-group headers api-root user-id
                                              tenant-group-id)))
        (lib/ok (fetch-user-by-id headers api-root tenant user-id))
        (do
          (println (format "Tried to promote user: %s" user-id))
          (lib/internal-server-error))))))


(defn do-demote-user-from-admin
  [{:keys [api-root] :as keycloak} tenant author-claims user-id]
  (if (= (get author-claims "sub") user-id)
    (lib/bad-request {"reason" "Tried to alter own tenant role"})
    (let [headers (request-headers keycloak)
          tenant-group-id (get (group-by-path keycloak headers tenant)
                               "id")
          admin-group-id (get (group-by-path keycloak headers
                                             (format "%s/admin" tenant))
                              "id")]
      (if (and (= 204 (remove-user-from-group headers api-root user-id
                                              admin-group-id))
               (= 204 (add-user-to-group headers api-root user-id
                                         tenant-group-id)))
        (lib/ok (fetch-user-by-id headers api-root tenant user-id))
        (do
          (println (format "Tried to demote user: %s" user-id))
          (lib/internal-server-error))))))

(defn do-remove-user
  [{:keys [api-root] :as keycloak} tenant author-claims user-id]
  (if (= (get author-claims "sub") user-id)
    (lib/bad-request {"reason" "Tried to alter own tenant role"})
    (let [headers (request-headers keycloak)
          tenant-group-id (get (group-by-path keycloak headers tenant)
                               "id")
          admin-group-id (get (group-by-path keycloak headers
                                             (format "%s/admin" tenant))
                              "id")]
      (if (and (= 204 (remove-user-from-group headers api-root user-id
                                              admin-group-id))
               (= 204 (remove-user-from-group headers api-root user-id
                                              tenant-group-id)))
        (lib/ok {})
        (do
          (println (format "Tried to remove user: %s" user-id))
          (lib/internal-server-error))))))


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
    (when-let [user-id (-> (client/get (format "%s/users/?email=%s" api-root email) req-opts)
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
  ([keycloak email]
   (allowed-paths keycloak email {}))
  ([{:keys [api-root http-timeout user-id-cache connection-manager] :as keycloak} email
    {:keys [timeout] :or {timeout http-timeout}}]
   (let [bare-req-opts {:timeout timeout}]
     (when-let [headers (request-headers keycloak bare-req-opts)]
       (let [req-opts (assoc bare-req-opts :headers headers :connection-manager connection-manager)]
         (when-let [user-id (lookup-user-id req-opts api-root user-id-cache email)]
           (->> (client/get (format "%s/users/%s/groups" api-root user-id) req-opts)
                :body
                json/decode
                (reduce (fn [paths {:strs [path]}]
                          (conj paths (subs path 12)))
                        #{}))))))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; KeycloakAgent Component
;;;

(defrecord KeycloakAgent [issuer openid-config api-root user-id-cache]
  p/KeycloakUserManagement
  (add-user-with-email [{:keys [api-root] :as keycloak} tenant-label email]
    (let [headers (request-headers keycloak)
          user-id (get (fetch-user-by-email headers api-root email)
                       "id")
          group-id (get (group-by-path keycloak headers tenant-label)
                        "id")]
      (and (= 204 (add-user-to-group
                   headers api-root user-id group-id))
           (= 204 (set-user-have-verified-email
                   headers api-root user-id)))))

  (create-user [{:keys [api-root]} headers email]
    (client/post (format "%s/users" api-root)
                 {:body (json/encode
                         {"username" email
                          "email" email
                          "emailVerified" false
                          "enabled" true})
                  :headers headers}))
  (demote-user-from-admin
    [this tenant author-claims user-id]
    (do-demote-user-from-admin this tenant author-claims user-id))

  (promote-user-to-admin
    [this tenant author-claims user-id]
    (do-promote-user-to-admin this tenant author-claims user-id))

  (reset-password [{:keys [api-root]} headers user-id tmp-password]
    (client/put (format "%s/users/%s/reset-password" api-root user-id)
                {:body (json/encode {"temporary" true
                                     "type" "password"
                                     "value" tmp-password})
                 :headers headers}))
  (remove-user
    [this tenant author-claims user-id]
    (do-remove-user this tenant author-claims user-id))

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

(defn- init-keycloak [{:keys [credentials http-timeout url realm max-user-ids-cache]}]
  (map->KeycloakAgent {:api-root (format "%s/admin/realms/%s" url realm)
                       :credentials credentials
                       :issuer (format "%s/realms/%s" url realm)
                       :user-id-cache (atom (cache/lru-cache-factory {} :threshold max-user-ids-cache))
                       :http-timeout http-timeout}))

(defmethod ig/init-key :akvo.lumen.component.keycloak/data  [_ {:keys [url realm] :as opts}]
  (try
    (let [issuer (str url "/realms/" realm)
         rsa-key  (-> (str issuer "/protocol/openid-connect/certs")
                      client/get
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

(s/def ::data (s/keys :req-un [::url
                               ::realm
                               ::client-id]))

(defmethod ig/pre-init-spec :akvo.lumen.component.keycloak/data [_]
  ::data)

(defn new-connection-manager
  ([] (new-connection-manager {}))
  ([opts]
   (let [default-values {:timeout 1000 :threads 2 :insecure? false :default-per-route 2}]
     (http.conn-mgr/make-reusable-conn-manager (merge default-values (select-keys opts [:timeout :threads :insecure? :default-per-route]))))))

(defmethod ig/init-key :akvo.lumen.component.keycloak/keycloak  [_ {:keys [credentials data max-user-ids-cache] :as opts}]
  (log/info "Starting keycloak")
  (let [{:keys [issuer openid-config api-root] :as this} (init-keycloak (assoc data :credentials credentials :max-user-ids-cache max-user-ids-cache))
        http-timeout 10000
        connection-manager (new-connection-manager {:timeout (* 30 1000) :threads 10 :default-per-route 10})
        openid-config (fetch-openid-configuration issuer {:timeout http-timeout :connection-manager connection-manager})]
    (log/info "Successfully got openid-config from provider.")
    (assoc this
           :connection-manager connection-manager
           :http-timeout http-timeout
           :openid-config openid-config)))

(defmethod ig/halt-key! :akvo.lumen.component.keycloak/keycloak  [_ opts]
  (log/info :keycloak "closing connection manager" (:connection-manager opts))
  (http.conn-mgr/shutdown-manager (:connection-manager opts)))


(s/def ::client_id string?)
(s/def ::client_secret string?)

(s/def ::credentials (s/keys :req-un [::client_id
                                      ::client_secret]))

(s/def ::max-user-ids-cache pos-int?)
(s/def ::config (s/keys :req-un [::data ::credentials ::max-user-ids-cache]))

(s/def ::keycloak (s/and (partial satisfies? p/KeycloakUserManagement)
                         (partial satisfies? p/Authorizer)))

(defmethod ig/pre-init-spec :akvo.lumen.component.keycloak/keycloak [_]
  ::config)
