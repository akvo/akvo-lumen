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
  (users [this tenant-label] "List tenants users")
  (add-user-with-email [this tenant-label email] "Add user to tenant")
  (user? [this email] "Predicate to see if the email has a user in KC"))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helpers
;;;

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
;;; groups and does not support new sub groups!!!!!!
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
      (prn e)
      (let [ed (ex-data e)]
        (prn ed)
        (response {:status (:status ed)
                   :body (:reasonPhrase ed)})))))

(defn fetch-user-by-email
  "Get user by email. Returns nil if none found."
  [api-root request-options email]
  (let [candidates (-> (client/get (format "%s/users?email=%s" api-root email)
                                   request-options)
                       :body json/decode)]
    ;; Since the keycloak api does a search and not a key lookup on the email
    ;; we need make sure that we have an exact match
    (first (filter (fn [candidate]
                     (= (get candidate "email") email))
                   candidates))))

(defn add-user-to-group
  [api-root request-options user-id group-id]
  (:status (client/put (format "%s/users/%s/groups/%s"
                          api-root user-id group-id)
                  request-options)))

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
  (users [this tenant-label]
    (tenant-members this tenant-label))

  (add-user-with-email [{:keys [api-root] :as keycloak} tenant-label email]
    (let [request-options (request-options keycloak)
          user-id (get (fetch-user-by-email api-root request-options email)
                       "id")
          group-id (get (group-by-path keycloak tenant-label request-options)
                        "id")
          resp-code (add-user-to-group api-root request-options user-id group-id)]
      (= resp-code 204)))

  (user? [keycloak email]
    (let [request-options (request-options keycloak)]
      (not (nil? (fetch-user-by-email (:api-root keycloak)
                                      request-options
                                      email))))))

(defn keycloak [{:keys [client-id url realm user password]}]
  (map->KeycloakAgent {:issuer (format "%s/realms/%s" url realm)
                       :api-root (format "%s/admin/realms/%s" url realm)
                       :credentials {"username" user
                                     "password" password
                                     "client_id" client-id}}))
