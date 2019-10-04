(ns akvo.lumen.lib.user
  (:require [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.db.user :as db.user]
            [akvo.lumen.lib.share :refer [random-url-safe-string]]
            [akvo.lumen.protocols :as p]
            [clj-time.coerce :as c]
            [clj-time.core :as t]
            [clojure.string :as str]            
            [selmer.parser :as selmer]))

(defn expire-time []
  (c/to-sql-time (t/plus (t/now)
                         (t/weeks 2))))

(defn- invite-id* [tenant-conn author email]
  (-> (db.user/insert-invite tenant-conn
                     {:author author
                      :email email
                      :expire (expire-time)})
      first :id))

(defn invite-to-tenant
  "Create an invite and use provider emailer to send an invitation email."
  [emailer tenant-conn auth-type location email author-claims]
  (let [invite-id (invite-id* tenant-conn author-claims email)
        text-part (selmer/render-file (format "akvo/lumen/email/%s/invite_to_tenant.txt" (name auth-type))
                    {:author-email (get author-claims "email")
                     :invite-id invite-id
                     :location location})]
    (p/send-email emailer [email] {"Subject" "Akvo Lumen invite"
                                   "Text-part" text-part})))

(defn new-invitation-id [tenant-conn author-claims email]
  (invite-id* tenant-conn author-claims email))

(defn send-invitation-account-email [emailer sender-email email location invite-id tmp-password auth-type]
  (let [text-part (selmer/render-file
                   (format "akvo/lumen/email/%s/create_new_account_and_invite_to_tenant.txt" (name auth-type))
                   {:author-email sender-email
                    :email email
                    :invite-id invite-id
                    :location location
                    :tmp-password tmp-password})]
    (p/send-email emailer [email] {"Subject" "Akvo Lumen invite"
                                   "Text-part" text-part})))

(defn create-new-account [keycloak tenant-conn email]
  (let [headers (keycloak/request-headers keycloak)
        user-id (-> (p/create-user keycloak headers email)
                    (get-in [:headers "Location"])
                    (str/split #"/")
                    last)
        tmp-password (random-url-safe-string 6)]
    (p/reset-password keycloak headers user-id tmp-password)
    {:email email
     :user-id user-id
     :tmp-password tmp-password}))

(defn create-invite
  "First check if user is already a member of current tenant, then don't invite.
  Then check if user has an account, if so invite to tenant. As a last resort
  setup an invitation to the provided email address for both an account and to
  the tenant."
  [emailer keycloak tenant-conn auth-type tenant location email author-claims]
  (cond
    (keycloak/tenant-member?
     keycloak tenant email) (lib/bad-request
                             {"reason" "Already tenant member"})
    (p/user? keycloak email) (invite-to-tenant emailer tenant-conn auth-type location email
                                       author-claims)
    :else
    (let [tmp-password (:tmp-password (create-new-account keycloak tenant-conn email))
          invitation-id (new-invitation-id tenant-conn author-claims email)
          sender-email (get author-claims "email")]
      (send-invitation-account-email emailer sender-email email location invitation-id tmp-password auth-type)))
  (lib/ok {}))

(defn active-invites [tenant-conn]
  (lib/ok {:invites (db.user/select-active-invites tenant-conn)}))

(defn delete-invite
  "Deletes non consumed invites, returns 210 if invite was consumed and
  204 in any other case (both delete of actual invite or non existing).
  We don't want to delete invites that was used. This since we store who
  created the invite in the \"author\" db field, and this provides
  traceability. Hence we don't allow deletion of consumed invite."
  [tenant-conn id]
  (if (zero? (first (db.user/delete-invite-by-id tenant-conn {:id id})))
    (lib/gone {})
    (lib/ok {})))

(defn verify-invite
  "Try and consume invite; Add user to keycloak; redirect to app."
  [keycloak tenant-conn tenant id location]
  (if-let [{:keys [email]} (first (db.user/consume-invite tenant-conn {:id id}))]
    (if-let [accepted (p/add-user-with-email keycloak tenant email)]
      (lib/redirect location)
      (lib/unprocessable-entity (format "<html><body>%s</body></html>"
                                        "Problem completing your invite.")))
    (lib/unprocessable-entity "Could not verify invite.")))

(defn users
  [keycloak tenant]
  (p/users keycloak tenant))

(defn user
  [keycloak tenant email]
  (p/user keycloak tenant email))

(defn remove-user
  [keycloak tenant author-claims user-id]
  (p/remove-user keycloak tenant author-claims user-id))

(defn demote-user-from-admin
  [keycloak tenant author-claims user-id]
  (p/demote-user-from-admin keycloak tenant author-claims user-id))

(defn promote-user-to-admin
  [keycloak tenant author-claims user-id]
  (p/promote-user-to-admin keycloak tenant author-claims user-id))

(defn change-names
  [keycloak tenant author-claims user-id first-name last-name]
  (p/change-names keycloak tenant author-claims user-id first-name last-name))
