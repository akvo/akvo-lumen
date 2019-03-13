(ns akvo.lumen.component.keycloak
  "We leverage Keycloak groups for tenant partition and admin roles.
   More info can be found in the Keycloak integration doc spec."
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.protocols :as p]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [integrant.core :as ig]
            [clojure.spec.alpha :as s]
            [clojure.set :as set]
            [clojure.tools.logging :as log]
            [ring.util.response :refer [response]]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helper fns
;;;

(defn fetch-openid-configuration
  "Get the openid configuration"
  [issuer]
  (-> (client/get (format "%s/.well-known/openid-configuration" issuer))
      :body json/decode))

(defn request-headers
  "Create a set of request headers to use for interaction with the Keycloak
   REST API. This allows us to reuse the same token for multiple requests."
  [{:keys [openid-config credentials]}]
  (let [params (merge {:grant_type "client_credentials"}
                      credentials)
        resp (client/post (get openid-config "token_endpoint")
                          {:form-params params})
        access-token (-> resp :body json/decode (get "access_token"))]
    {"Authorization" (str "bearer " access-token)
     "Content-Type" "application/json"}))

(defn group-by-path
  "Get the group id (uuid) by using group path.

  For example:
    (group-by-path keycloak request-headers \"/akvo/lumen/t1/admin\") -> uuid"
  [{:keys [api-root credentials openid-config]} request-headers path]
  (-> (client/get (format "%s/group-by-path/%s"
                          api-root (format "akvo/lumen/%s" path))
                  {:headers request-headers})
      :body json/decode))

(defn group-members
  "Return groups memebers using a group id"
  [{:keys [api-root credentials openid-config]} request-headers group-id]
  (-> (client/get (format "%s/groups/%s/members"
                          api-root group-id)
                  {:headers request-headers})
      :body json/decode))

(defn tenant-members
  "Return the users for a tenant. The tenant label here becomes the group-name"
  [keycloak tenant-label]
  (try
    (let [request-headers (request-headers keycloak)
          tenant-group (group-by-path keycloak request-headers tenant-label)
          group-id (get tenant-group "id")
          users  (map #(assoc % "admin" false)
                      (group-members keycloak request-headers group-id))
          admin-group-id (get (first (filter #(= "admin"
                                                 (get % "name"))
                                             (get-in tenant-group ["subGroups"])))
                              "id")
          admins (map #(assoc % "admin" true)
                      (group-members keycloak request-headers admin-group-id))
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
  [request-headers api-root tenant user-id]
  (let [admin-group-id (-> (client/get (format "%s/group-by-path/akvo/lumen/%s/admin"
                                               api-root tenant)
                                       {:headers request-headers})
                           :body json/decode (get "id"))
        admins (-> (client/get (format "%s/groups/%s/members" api-root admin-group-id)
                               {:headers request-headers})
                   :body json/decode)
        admin-ids (into #{}
                        (map #(get % "id"))
                        (filter #(and (get % "emailVerified")
                                      (get % "enabled"))
                                admins))]
    (contains? (set admin-ids) user-id)))

(defn fetch-user-by-id
  "Get user by email. Returns nil if not found."
  [request-headers api-root tenant user-id]
  (let [resp (-> (client/get (format "%s/users/%s" api-root user-id)
                             {:headers request-headers})
                 :body json/decode)]
    (assoc resp
           "admin"
           (tenant-admin? request-headers api-root tenant user-id))))

(defn fetch-user-by-email
  "Get user by email. Returns nil if none found."
  [request-headers api-root email]
  (let [candidates (-> (client/get (format "%s/users?email=%s"
                                           api-root email)
                                   {:headers request-headers})
                       :body json/decode)]
    ;; Since the keycloak api does a search and not a key lookup on the email
    ;; we need make sure that we have an exact match
    (first (filter (fn [candidate]
                     (= (get candidate "email") email))
                   candidates))))

(defn fetch-user-groups
  "Get the groups of the user"
  [request-headers api-root user-id]
  (-> (client/get (format "%s/users/%s/groups" api-root user-id)
                  {:headers request-headers})
      :body json/decode))

(defn tenant-member?
  "Return true for both members and admins."
  [{:keys [api-root] :as keycloak} tenant email]
  (let [request-headers (request-headers keycloak)]
    (if-let [user-id
             (get (fetch-user-by-email request-headers api-root email) "id")]
      (let [possible-group-paths (set (map #(format % tenant)
                                           ["/akvo/lumen/%s" "/akvo/lumen/%s/admin"]))
            user-groups (fetch-user-groups request-headers api-root user-id)
            user-group-paths (reduce (fn [path-set group]
                                       (conj path-set (get group "path")))
                                     #{}
                                     user-groups)]
        (not (empty? (set/intersection possible-group-paths user-group-paths))))
      false)))


(defn add-user-to-group
  "Returns status code from Keycloak response."
  [request-headers api-root user-id group-id]
  (:status (client/put (format "%s/users/%s/groups/%s"
                               api-root user-id group-id)
                       {:headers request-headers})))

(defn remove-user-from-group
  "Returns status code from Keycloak response."
  [request-headers api-root user-id group-id]
  (:status (client/delete (format "%s/users/%s/groups/%s"
                                  api-root user-id group-id)
                          {:headers request-headers})))

(defn set-user-have-verified-email
  "Returns status code from Keycloak response."
  [request-headers api-root user-id]
  (:status (client/put (format "%s/users/%s" api-root user-id)
                       {:body (json/encode {"emailVerified" true})
                        :headers request-headers})))

(defn do-promote-user-to-admin
  [{:keys [api-root] :as keycloak} tenant author-claims user-id]
  (if (= (get author-claims "sub") user-id)
    (lib/bad-request {"reason" "Tried to alter own tenant role"})
    (let [request-headers (request-headers keycloak)
          tenant-group-id (get (group-by-path
                                keycloak request-headers tenant) "id")
          admin-group-id (get (group-by-path
                               keycloak request-headers
                               (format "%s/admin" tenant)) "id")]
      (if (and (= 204 (add-user-to-group request-headers api-root user-id
                                         admin-group-id))
               (= 204 (remove-user-from-group request-headers api-root user-id
                                              tenant-group-id)))
        (lib/ok (fetch-user-by-id request-headers api-root tenant user-id))
        (do
          (println (format "Tried to promote user: %s" user-id))
          (lib/internal-server-error))))))


(defn do-demote-user-from-admin
  [{:keys [api-root] :as keycloak} tenant author-claims user-id]
  (if (= (get author-claims "sub") user-id)
    (lib/bad-request {"reason" "Tried to alter own tenant role"})
    (let [request-headers (request-headers keycloak)
          tenant-group-id (get (group-by-path keycloak request-headers tenant)
                               "id")
          admin-group-id (get (group-by-path keycloak request-headers
                                             (format "%s/admin" tenant))
                              "id")]
      (if (and (= 204 (remove-user-from-group request-headers api-root user-id
                                              admin-group-id))
               (= 204 (add-user-to-group request-headers api-root user-id
                                         tenant-group-id)))
        (lib/ok (fetch-user-by-id request-headers api-root tenant user-id))
        (do
          (println (format "Tried to demote user: %s" user-id))
          (lib/internal-server-error))))))

(defn do-remove-user
  [{:keys [api-root] :as keycloak} tenant author-claims user-id]
  (if (= (get author-claims "sub") user-id)
    (lib/bad-request {"reason" "Tried to alter own tenant role"})
    (let [request-headers (request-headers keycloak)
          tenant-group-id (get (group-by-path keycloak request-headers tenant)
                               "id")
          admin-group-id (get (group-by-path keycloak request-headers
                                             (format "%s/admin" tenant))
                              "id")]
      (if (and (= 204 (remove-user-from-group request-headers api-root user-id
                                              admin-group-id))
               (= 204 (remove-user-from-group request-headers api-root user-id
                                              tenant-group-id)))
        (lib/ok {})
        (do
          (println (format "Tried to remove user: %s" user-id))
          (lib/internal-server-error))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; KeycloakAgent Component
;;;

(defrecord KeycloakAgent [issuer openid-config api-root]
  p/KeycloakUserManagement
  (add-user-with-email [{:keys [api-root] :as keycloak} tenant-label email]
    (let [request-headers (request-headers keycloak)
          user-id (get (fetch-user-by-email request-headers api-root email)
                       "id")
          group-id (get (group-by-path keycloak request-headers tenant-label)
                        "id")]
      (and (= 204 (add-user-to-group
                   request-headers api-root user-id group-id))
           (= 204 (set-user-have-verified-email
                   request-headers api-root user-id)))))

  (create-user [{:keys [api-root]} request-headers email]
    (client/post (format "%s/users" api-root)
                 {:body (json/encode
                         {"username" email
                          "email" email
                          "emailVerified" false
                          "enabled" true})
                  :headers request-headers}))
  (demote-user-from-admin
    [this tenant author-claims user-id]
    (do-demote-user-from-admin this tenant author-claims user-id))

  (promote-user-to-admin
    [this tenant author-claims user-id]
    (do-promote-user-to-admin this tenant author-claims user-id))

  (reset-password [{:keys [api-root]} request-headers user-id tmp-password]
    (client/put (format "%s/users/%s/reset-password" api-root user-id)
                {:body (json/encode {"temporary" true
                                     "type" "password"
                                     "value" tmp-password})
                 :headers request-headers}))
  (remove-user
    [this tenant author-claims user-id]
    (do-remove-user this tenant author-claims user-id))

  (user? [keycloak email]
    (let [request-headers (request-headers keycloak)]
      (not (nil? (fetch-user-by-email request-headers
                                      (:api-root keycloak)
                                      email)))))

  (users [this tenant-label]
    (tenant-members this tenant-label)))

(defn- keycloak [{:keys [credentials url realm]}]
  (map->KeycloakAgent {:issuer (format "%s/realms/%s" url realm)
                       :api-root (format "%s/admin/realms/%s" url realm)
                       :credentials credentials}))

(defmethod ig/init-key :akvo.lumen.component.keycloak/data  [_ {:keys [url realm] :as opts}]
  opts)

(s/def ::url string?)
(s/def ::realm string?)

(s/def ::data (s/keys :req-un [::url
                               ::realm]))

(defmethod ig/pre-init-spec :akvo.lumen.component.keycloak/data [_]
  ::data)

(defmethod ig/init-key :akvo.lumen.component.keycloak/keycloak  [_ {:keys [credentials data] :as opts}]
  (let [{:keys [issuer openid-config api-root] :as this} (keycloak (assoc data :credentials credentials))
        openid-config (fetch-openid-configuration issuer)]
      (log/info "Successfully got openid-config from provider.")
      (assoc this :openid-config openid-config)))

(s/def ::client_id string?)
(s/def ::client_secret string?)

(s/def ::credentials (s/keys :req-un [::client_id
                                      ::client_secret]))

(s/def ::config (s/keys :req-un [::data ::credentials]))

(s/def ::keycloak (partial satisfies? p/KeycloakUserManagement))

(defmethod ig/pre-init-spec :akvo.lumen.component.keycloak/keycloak [_]
  ::config)
