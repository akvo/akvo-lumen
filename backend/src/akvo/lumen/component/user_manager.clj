(ns akvo.lumen.component.user-manager
  (:require [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.component.emailer :as emailer]
            [akvo.lumen.lib.share-impl :refer [random-url-safe-string]]
            [akvo.lumen.auth :as auth]
            [akvo.lumen.http :as http]
            [clj-time.coerce :as c]
            [clj-time.core :as t]
            [clojure.string :as str]
            [com.stuartsierra.component :as component]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response redirect]]))

(hugsql/def-db-fns "akvo/lumen/component/user_manager.sql")

(defprotocol UserManagement
  (invite
    [this tenant-conn server-name email author-claims]
    "Invite user with email to tenant.")

  (invites
    [this tenant-conn]
    "List active invites.")

  (delete-invite
    [this tenant-conn id]
    "Deletes non consumed invites, returns 210 if invite was consumed and
     204 in any other case (both delete of actual invite or non existing).

     We don't want to delete invites that was used. This since we store who
     created the invite in the \"author\" db field, and this provides
     traceability. Hence we don't allow deletion of consumed invite.")

  (demote-user-from-admin
    [this tenant author-claims user-id]
    "Promote existing user to admin")

  (promote-user-to-admin
    [this tenant author-claims user-id]
    "Promote existing user to admin")

  (tenant-invite-email
    [this server-name invite-id author-claims]
    "Constructs the tenant invite email body")

  (user-and-tenant-invite-email
    [this server-name invite-id author-claims email tmp-password]
    "Constructs user and tenant invite email body")

  (users
    [this tenant]
    "List users of tenant.")

  (verify-invite
    [this tenant-conn tenant id]
    "Add user to tenant."))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helper fns
;;;

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

(defmulti yank-user-id
  (fn [keycloak request-draft response]
    (:status response)))

(defmethod yank-user-id 201
  [_ _ {{:strs [Location]} :headers}]
  (last (str/split Location #"/")))

(defn do-user-and-tenant-invite
  [{:keys [api-root emailer keycloak] :as user-manager}
   tenant-conn server-name email author-claims]
  (let [request-draft (keycloak/request-draft keycloak)
        user-id (yank-user-id keycloak request-draft
                              (keycloak/create-user keycloak request-draft email))
        tmp-password (random-url-safe-string 6)
        {invite-id :id}
        (first (insert-invite tenant-conn
                              {:author author-claims
                               :email email
                               :expire (c/to-sql-time (t/plus (t/now)
                                                              (t/weeks 2)))}))
        recipients [email]
        text-part (user-and-tenant-invite-email
                   user-manager server-name invite-id (get author-claims "name")
                   email tmp-password)
        email {"Subject" "Akvo Lumen invite"
               "Text-part" text-part}]
    (keycloak/reset-password keycloak request-draft user-id tmp-password)
    (emailer/send-email emailer recipients email)))


(defn do-verify-invite [tenant-conn keycloak tenant id location]
  (if-let [{email :email} (first (consume-invite tenant-conn {:id id}))]
    (if-let [accepted (keycloak/add-user-with-email keycloak tenant email)]
      (redirect location)
      (response {:body (format "<html><body>%s</body></html>"
                               "Problem completing your invite.")
                 :status 422}))
    (response {:status 422
               :body "Could not verify invite."})))

(defn do-delete-invite
  "Delete invites that have not been used"
  [tenant-conn id]
  (delete-non-consumed-invite-by-id tenant-conn {:id id})
  (if (empty? (select-consumed-invite-by-id tenant-conn {:id id}))
    (http/no-content)
    (http/gone)))



#_(defn do-promote-user-to-admin
  [keycloak tenant author-claims user-id]
  (clojure.pprint/pprint tenant)
  (clojure.pprint/pprint author-claims)
  (clojure.pprint/pprint user-id)


    (if (= (get author-claims "sub") user-id)
      (http/bad-request {"reason" "Tried to alter own tenant role"})

      (if (auth/tenant-admin? {:jwt-claims author-claims :tenant tenant})

        (http/not-implemented)
        (http/not-authorized {"reason" "Not tenant admin"})))

  ;; - Who promoted a user?
  ;; - Can a user self promote (demote)?
  ;; - Is user authorized to promote other user?
  ;; - Is the user a tenant memeber?

  ;; author = user-id -> 400

  )


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; UserManager component
;;;

(defrecord UserManager []

  component/Lifecycle
  (start [this]
    this)

  (stop [this]
    this)

  UserManagement
  (invite [{keycloak :keycloak :as this}
           tenant-conn server-name email author-claims]

    (future (if (keycloak/user? keycloak email)
              (do-tenant-invite this tenant-conn server-name email author-claims)
              (do-user-and-tenant-invite
               this tenant-conn server-name email author-claims)))
    (response {:invite "created"}))

  (invites [this tenant-conn]
    (response (select-active-invites tenant-conn)))

  (delete-invite [this tenant-conn id]
    (do-delete-invite tenant-conn id))

  (demote-user-from-admin
    [{keycloak :keycloak} tenant author-claims user-id]
    (keycloak/demote-user-from-admin keycloak tenant author-claims user-id))

  (promote-user-to-admin
    [{keycloak :keycloak} tenant author-claims user-id]
    (keycloak/promote-user-to-admin keycloak tenant author-claims user-id))

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

  (user-and-tenant-invite-email
    [this server-name invite-id author-name email tmp-password]
    (str/join
     "\n"
     ["Hi,"
      ""
      (format "You been invited to join %s by %s." server-name author-name)
      "To complete your invite please visit:"
      (format "https://%s/verify/%s" server-name invite-id)
      (format "Using your email: %s" email)
      (format "and the temporary password: %s to login." tmp-password)
      ""
      "Thanks"
      "Akvo"]))

  (users [{:keys [keycloak]} tenant]
    (keycloak/users keycloak tenant))

  (verify-invite [{keycloak :keycloak} tenant-conn tenant id]
    (do-verify-invite tenant-conn keycloak tenant id "/")))

(defn user-manager [options]
  (map->UserManager options))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; DevUsermanager component
;;;

(defrecord DevUserManager []

  component/Lifecycle
  (start [this]
    this)

  (stop [this]
    this)

  UserManagement
  (invite [{keycloak :keycloak :as this}
           tenant-conn server-name email author-claims]
    (if (keycloak/user? keycloak email)
      (do-tenant-invite this tenant-conn server-name email author-claims)
      (do-user-and-tenant-invite this tenant-conn server-name email author-claims))
    (response {:invite "created"}))

  (invites [this tenant-conn]
    (response (select-active-invites tenant-conn)))

  (delete-invite [this tenant-conn id]
    (do-delete-invite tenant-conn id))

  (demote-user-from-admin
    [{keycloak :keycloak} tenant author-claims user-id]
    (keycloak/demote-user-from-admin keycloak tenant author-claims user-id))

  (promote-user-to-admin
    [{keycloak :keycloak} tenant author-claims user-id]
    (keycloak/promote-user-to-admin keycloak tenant author-claims user-id))

  (tenant-invite-email [this server-name invite-id author-name]
    (format "http://%s:3000/verify/%s" server-name invite-id))

  (user-and-tenant-invite-email
    [this server-name invite-id author-name email tmp-password]
    (format "http://%s:3000/verify/%s [username: %s | password: %s]"
            server-name invite-id email tmp-password))

  (users [{:keys [keycloak]} tenant]
    (keycloak/users keycloak tenant))

  (verify-invite [{keycloak :keycloak} tenant-conn tenant id]
    (do-verify-invite tenant-conn keycloak tenant id
                      (format "http://%s.lumen.localhost:3030" tenant))))

(defn dev-user-manager [options]
  (map->DevUserManager options))
