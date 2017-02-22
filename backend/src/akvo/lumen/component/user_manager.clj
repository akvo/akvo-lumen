(ns akvo.lumen.component.user-manager
  (:require [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.component.emailer :as emailer]
            [com.stuartsierra.component :as component]
            [clj-time.coerce :as c]
            [clj-time.core :as t]
            [clojure.string :as str]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response redirect]]))

(hugsql/def-db-fns "akvo/lumen/component/user_manager.sql")

(defprotocol IUserManager
  (users [this tenant] "List users of tenant.")
  (tenant-invite-email [this server-name invite-id author-name]
    "Constructs the invite email body")
  (invite [this tenant-conn server-name email author-claims]
    "Invite user with email to tenant.")
  (invites [this tenant-conn] "List active invites.")
  (verify-invite [this tenant-conn tenant id] "Add user to tenant."))


(defn do-tenant-invite
  [{emailer :emailer :as user-manager}
   tenant-conn server-name email author-claims]
  (let [{invite-id :id :as invite}
        (first (insert-invite tenant-conn
                              {:author author-claims
                               :email email
                               :expire (c/to-sql-time (t/plus (t/now)
                                                              (t/weeks 2)))}))
        recipients [email]
        text-part (tenant-invite-email user-manager server-name invite-id
                                       (get author-claims "name"))
        email {"Subject" "Akvo Lumen invite"
               "Text-part" text-part}]
    (emailer/send-email emailer recipients email)))

(defn do-user-and-tenant-invite [user-manager tenant-conn server-name email author-claims]
  (println "Should invite user"))


(defn do-verify-invite [tenant-conn keycloak tenant id location]
  (if-let [{email :email} (first (consume-invite tenant-conn {:id id}))]
    (if-let [accepted (keycloak/add-user-with-email keycloak tenant email)]
      (redirect location)
      (response {:body (format "<html><body>%s</body></html>"
                               "Problem completing your invite.")
                 :status 422}))
    (response {:status 422
               :body "Could not verify invite."})))

(defrecord UserManager []

  component/Lifecycle
  (start [this]
    this)

  (stop [this]
    this)

  IUserManager
  (users [{:keys [keycloak]} tenant]
    (keycloak/users keycloak tenant))

  (tenant-invite-email [this server-name invite-id author-name]
    (str/join
     "\n"
     ["Hi,"
      ""
      (format "You been invited to join %s by %s." server-name author-name)
      "To complete your invite please visit:"
      (format "https://%s/verify/%s" server-name invite-id)
      ""
      "Thanks"
      "Akvo"]))

  (invite [{keycloak :keycloak :as this}
           tenant-conn server-name email author-claims]
    #_(future
        (do-invite tenant-conn this server-name email author-claims))

    (if (keycloak/user? keycloak email)
      (do-tenant-invite this tenant-conn server-name email author-claims)
      (do-user-and-tenant-invite this tenant-conn server-name email author-claims))
    (response {:invite "created"}))

  (invites [this tenant-conn]
    (response (select-active-invites tenant-conn)))

  (verify-invite [{keycloak :keycloak} tenant-conn tenant id]
    (do-verify-invite tenant-conn keycloak tenant id "/")))

(defn user-manager [options]
  (map->UserManager options))


(defrecord DevUserManager []

  component/Lifecycle
  (start [this]
    this)

  (stop [this]
    this)

  IUserManager
  (users [{:keys [keycloak]} tenant]
    (keycloak/users keycloak tenant))

  (tenant-invite-email [this server-name invite-id author-name]
    (format "http://%s:3000/verify/%s" server-name invite-id))

  (invite [{keycloak :keycloak :as this}
           tenant-conn server-name email author-claims]
    (if (keycloak/user? keycloak email)
      (do-tenant-invite this tenant-conn server-name email author-claims)
      (do-user-and-tenant-invite this tenant-conn server-name email author-claims))
    (response {:invite "created"}))

  (invites [this tenant-conn]
    (response (select-active-invites tenant-conn)))

  (verify-invite [{keycloak :keycloak} tenant-conn tenant id]
    (do-verify-invite tenant-conn keycloak tenant id
                      (format "http://%s.lumen.localhost:3030" tenant))))

(defn dev-user-manager [options]
  (map->DevUserManager options))
