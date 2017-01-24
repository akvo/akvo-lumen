(ns akvo.lumen.component.keycloak
  "Keycloak component."
  (:require [akvo.lumen.auth :refer [tenant-admin?]]
            [cheshire.core :as json]
            [com.stuartsierra.component :as component]
            [clj-http.client :as client]
            [clojure.set :as set]
            [ring.util.response :refer [not-found response]]))


;;; The "agent user account" needs to have the client role role mapping:
;;; manage-realm
;;; manage-users
;;;

(defprotocol UserManager
  #_(tenant-admin? [tenant-label roles] "Is user admin at tenant")
  (users [this tenant-label roles] "List tenants users")
  (invites [this tenant-label roles tenant-conn] "ist active invites")
  (invite [this tenant-label roles tenant-conn email] "Invite user to tenant"))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helpers
;;;

#_(defn tenant-admin?
  [tenant-label claimed-roles]
  (contains? (set claimed-roles)
             (format "akvo:lumen:%s:admin" tenant-label)))

(defn fetch-openid-configuration
  "Get the openid configuration"
  [issuer]
  (-> (client/get (format "%s/.well-known/openid-configuration" issuer))
      :body json/decode))

(defn request-options [{:keys [openid-config credentials]}]
  (let [params (merge {"grant_type" "password"} credentials)
        response (client/post (get openid-config "token_endpoint")
                              {:form-params params})
        access-token (-> response :body json/decode (get "access_token"))]
    {:headers {"Authorization" (str "bearer " access-token)
               "Content-Type" "application/json"}}))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helpers
;;;

(defn group-by-path
  [{:keys [api-root credentials openid-config]} path request-options]
  (-> (client/get (format "%s/group-by-path/%s"
                          api-root path)
                  request-options)
      :body json/decode))

(defn group-members
  [{:keys [api-root credentials openid-config]} group-id request-options]
  (-> (client/get (format "%s/groups/%s/members"
                          api-root group-id)
                  request-options)
      :body json/decode))

;;; This is kinda fragile, this relies on that one user not belog to multiple
;;; groups and does not support new swub groups!!!!!!
(defn tenant-members
  "Return the users for a tenant. The tenant label here becomes the group-name"
  [keycloak tenant-label]
  (try
    (let [options (request-options keycloak)
          tenant-group (group-by-path keycloak tenant-label options)
          group-id (get tenant-group "id")
          users (group-members keycloak group-id options)
          admin-group-id (get (first (filter #(= "admin"
                                                 (get % "name"))
                                             (get-in tenant-group ["subGroups"])))
                              "id")
          admins (map #(assoc % "admin" true)
                      (group-members keycloak admin-group-id options))
          members (filter #(and (get % "emailVerified") (get % "enabled"))
                          (concat admins users))
          response-filter ["admin" "email" "firstName" "id" "lastName"
                           "username"]]
      (response (map #(select-keys % response-filter) members)))
    (catch Exception e
      (let [ed (ex-data e)]
        (prn ed)
        (response {:status (:status ed)
                   :body (:reason-phrase ed)})))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helpers
;;;

(defn active-invites
  [keycloak tenant-label tenant-conn]
  (response []))

(defn invite-user
  [keycloak tenant-label body]
  ;; Cases
  ;; User already exists in tenant
  ;; User with email have not yet verified their email, or is disabled
  ;; There is no user with email in realm
  ;; There is a user in the realm to invite
  (response {"User to invite:" body}))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Component
;;;

(defrecord KeycloakAgent [issuer openid-config api-root]

  component/Lifecycle
  (start [this]
    (assoc this :openid-config (fetch-openid-configuration issuer)))

  (stop [this]
    (assoc this :openid-config nil))

  UserManager
  #_(tenant-admin? [tenant-label claimed-roles]
    (contains? (set claimed-roles)
               (format "akvo:lumen:%s:admin" tenant-label)))

  (users [this tenant-label roles]
    (if (tenant-admin? tenant-label roles)
      (tenant-members this tenant-label)
      {:body "Forbidden"
       :status 403}))

  (invites [this tenant-label roles conn]
    (if (tenant-admin? tenant-label roles)
      (active-invites this tenant-label conn)
      {:body "Forbidden"
       :status 403}))

  (invite [this tenant-label roles conn body]
    (if (tenant-admin? tenant-label roles)
      (invite-user this tenant-label body)
      {:body "Forbidden"
       :status 403})))

(defn keycloak [{:keys [client-id url realm user password]}]
  (map->KeycloakAgent {:issuer (format "%s/realms/%s" url realm)
                       :api-root (format "%s/admin/realms/%s" url realm)
                       :credentials {"username" user
                                     "password" password
                                     "client_id" client-id}}))
