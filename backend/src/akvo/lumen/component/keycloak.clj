(ns akvo.lumen.component.keycloak
  "We leverage Keycloak groups for tenant partition and admin roles.
   More info can be found in the Keycloak integration doc spec."
  (:require [akvo.lumen.auth :refer [tenant-admin?]]
            [cheshire.core :as json]
            [com.stuartsierra.component :as component]
            [clj-http.client :as client]
            [clojure.set :as set]
            [ring.util.response :refer [not-found response]]))


(defprotocol UserManager
  (add-user-with-email
    [this tenant-label email]
    "Add user to tenant")
  (create-user
    [this request-draft email]
    "Create user")
  (reset-password
    [this request-draft user-id tmp-password]
    "Set temporary user password")
  (user?
    [this email]
    "Predicate to see if the email has a user in KC")
  (users
    [this tenant-label]
    "List tenants users"))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helper fns
;;;

(defn fetch-openid-configuration
  "Get the openid configuration"
  [issuer]
  (-> (client/get (format "%s/.well-known/openid-configuration" issuer))
      :body json/decode))

(defn request-draft
  "Create a partial request with json content type and a valid bearer token.
   This token can be used for a batch of requests. This enables us to not have
   to get a new token for every request to Keycloak but one for task we have."
  [{:keys [openid-config credentials]}]
  (let [params (merge {"grant_type" "client_credentials"}
                      credentials)
        resp (client/post (get openid-config "token_endpoint")
                          {:form-params params})
        access-token (-> resp :body json/decode (get "access_token"))]
    {:headers {"Authorization" (str "bearer " access-token)
               "Content-Type" "application/json"}}))

(defn group-by-path
  "Get the group id (uuid) by using group path.

  For example:
    (group-by-path keycloak request-draft \"/akvo/lumen/t1/admin\") -> uuid"
  [{:keys [api-root credentials openid-config]} request-draft path]
  (-> (client/get (format "%s/group-by-path/%s"
                          api-root (format "akvo/lumen/%s" path))
                  request-draft)
      :body json/decode))

(defn group-members
  "Return groups memebers using a group id"
  [{:keys [api-root credentials openid-config]} request-draft group-id]
  (-> (client/get (format "%s/groups/%s/members"
                          api-root group-id)
                  request-draft)
      :body json/decode))

(defn tenant-members
  "Return the users for a tenant. The tenant label here becomes the group-name"
  [keycloak tenant-label]
  (try
    (let [request-draft (request-draft keycloak)
          tenant-group (group-by-path keycloak request-draft tenant-label)
          group-id (get tenant-group "id")
          users (group-members keycloak request-draft group-id)
          admin-group-id (get (first (filter #(= "admin"
                                                 (get % "name"))
                                             (get-in tenant-group ["subGroups"])))
                              "id")
          admins (map #(assoc % "admin" true)
                      (group-members keycloak request-draft admin-group-id))
          members (filter #(and (get % "emailVerified") (get % "enabled"))
                          (concat admins users))
          response-filter ["admin" "email" "firstName" "id" "lastName"
                           "username"]]
      (response (map #(select-keys % response-filter) members)))
    (catch clojure.lang.ExceptionInfo e
      (let [ed (ex-data e)]
        (response {:status (:status ed)
                   :body (:reasonPhrase ed)})))))

(defn fetch-user-by-email
  "Get user by email. Returns nil if none found."
  [request-draft api-root email]
  (let [candidates (-> (client/get (format "%s/users?email=%s"
                                           api-root email)
                                   request-draft)
                       :body json/decode)]
    ;; Since the keycloak api does a search and not a key lookup on the email
    ;; we need make sure that we have an exact match
    (first (filter (fn [candidate]
                     (= (get candidate "email") email))
                   candidates))))

(defn add-user-to-group
  "Returns status code from Keycloak response."
  [request-draft api-root user-id group-id]
  (:status (client/put (format "%s/users/%s/groups/%s"
                          api-root user-id group-id)
                  request-draft)))

(defn set-user-have-verified-email
  "Returns status code from Keycloak response."
  [request-draft api-root user-id]
  (:status (client/put (format "%s/users/%s" api-root user-id)
                       (assoc request-draft
                              :body (json/encode {"emailVerified" true})))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; KeycloakAgent Component
;;;

(defrecord KeycloakAgent [issuer openid-config api-root]

  component/Lifecycle
  (start [this]
    (assoc this :openid-config (fetch-openid-configuration issuer)))

  (stop [this]
    (assoc this :openid-config nil))

  UserManager
  (add-user-with-email [{:keys [api-root] :as keycloak} tenant-label email]
    (let [request-draft (request-draft keycloak)
          user-id (get (fetch-user-by-email request-draft api-root email)
                       "id")
          group-id (get (group-by-path keycloak request-draft tenant-label)
                        "id")]
      (and (= 204 (add-user-to-group
                   request-draft api-root user-id group-id))
           (= 204 (set-user-have-verified-email
                   request-draft api-root user-id)))))

  (create-user [{api-root :api-root} request-draft email]
    (client/post (format "%s/users" api-root)
                 (assoc request-draft
                        :body (json/encode
                               {"username" email
                                "email" email
                                "emailVerified" false
                                "enabled" true}))))

  (reset-password [{api-root :api-root} request-draft user-id tmp-password]
    (client/put (format "%s/users/%s/reset-password" api-root user-id)
                (assoc request-draft
                       :body (json/encode {"temporary" true
                                           "type" "password"
                                           "value" tmp-password}))))

  (user? [keycloak email]
    (let [request-draft (request-draft keycloak)]
      (not (nil? (fetch-user-by-email request-draft
                                      (:api-root keycloak)
                                      email)))))

  (users [this tenant-label]
    (tenant-members this tenant-label)))

(defn keycloak [{:keys [credentials url realm]}]
  (map->KeycloakAgent {:issuer (format "%s/realms/%s" url realm)
                       :api-root (format "%s/admin/realms/%s" url realm)
                       :credentials credentials}))
