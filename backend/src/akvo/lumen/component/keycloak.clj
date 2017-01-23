(ns akvo.lumen.component.keycloak
  "Keycloak component."
  (:require [cheshire.core :as json]
            [com.stuartsierra.component :as component]
            [clj-http.client :as client]
            [clojure.set :as set]
            [ring.util.response :refer [not-found response]]))


;;; The "agent user account" needs to have the client role role mapping:
;;; manage-realm
;;; manage-users
;;;

(defprotocol UserManager
  (users [this tenant-label authorization-token] "List tenants users")
  (add-user [this tenant-label user authorization-token] "Add user to tenant"))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helpers
;;;

(defn tenant-admin?
  [tenant-label claimed-roles]
  (contains? (set claimed-roles)
             (format "akvo:lumen:%s:admin" tenant-label)))

(defn fetch-openid-configuration
  "Get the openid configuration"
  [issuer]
  (-> (client/get (format "%s/.well-known/openid-configuration" issuer))
      :body json/decode))

(defn fetch-access-token [openid-config credentials]
  (let [params (merge {"grant_type" "password"} credentials)
        response (client/post (get openid-config "token_endpoint")
                              {:form-params params})]
    (-> response :body json/decode (get "access_token"))))

(defn headers-with-token [openid-config credentials]
  {"Authorization" (str "bearer " (fetch-access-token openid-config credentials))
   "Content-Type" "application/json"})

(defn fetch-users
  "Return the users for a tenant. The tenant label here becomes the group-name."
  [{:keys [api-root credentials openid-config]} group-name roles]
  (try
    (let [options {:headers (headers-with-token openid-config credentials)}
          group (-> (client/get (format "%s/group-by-path/%s"
                                        api-root group-name)
                                options)
                    :body json/decode)
          members (-> (client/get (format "%s/groups/%s/members"
                                          api-root (get group "id"))
                                  options)
                      :body json/decode)]
      (response members))
    (catch Exception e
      (let [ed (ex-data e)]
        (prn ed)
        (response {:status (:status ed)
                   :body (:reason-phrase ed)})))))


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
  (users [this tenant-label roles]
    (if (tenant-admin? tenant-label roles)
      (fetch-users this tenant-label roles)
      {:body "Forbidden"
       :status 403}))

  (add-user [this tenant-label user authorization-header]
    (clojure.pprint/pprint this)
    ;; Make sure to noly invite users that is enabled and have verified email
    (println "Add user")
    "ok"))

(defn keycloak [{:keys [url realm user password]}]
  (map->KeycloakAgent {:issuer (format "%s/realms/%s" url realm)
                       :api-root (format "%s/admin/realms/%s" url realm)
                       :credentials {"username" user
                                     "password" password
                                     "client_id" "akvo-lumen"}}))
