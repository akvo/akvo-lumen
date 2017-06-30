(ns akvo.lumen.lib.user-impl
  (:require [akvo.lumen.component.emailer :as emailer]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.share-impl :refer [random-url-safe-string]]
            [clj-time.coerce :as c]
            [clj-time.core :as t]
            [clojure.string :as str]
            [hugsql.core :as hugsql]
            [selmer.parser :as selmer]))

(hugsql/def-db-fns "akvo/lumen/lib/user.sql")

(defn invite-to-tenant
  "Create an invite and use provider emailer to send an invitation email."
  [emailer tenant-conn location email author-claims]
  (let [invite-id (-> (insert-invite tenant-conn
                                     {:author author-claims
                                      :email email
                                      :expire (c/to-sql-time (t/plus (t/now)
                                                                     (t/weeks 2)))})
                      first :id)
        text-part (selmer/render-file "akvo/lumen/email/invite_to_tenant.txt"
                                      {:location location
                                       :invite-id invite-id
                                       :author-name (get author-claims "name")} )]
    (emailer/send-email emailer [email] {"Subject" "Akvo Lumen invite"
                                         "Text-part" text-part})))

(defn create-new-account-and-invite-to-tenant
  ""
  [emailer keycloak tenant-conn location email
   {:strs [name] :as author-claims}]
  (let [request-headers (keycloak/request-headers keycloak)
        user-id (as-> (keycloak/create-user keycloak request-headers email) x
                  (:headers x)
                  (get x "Location")
                  (str/split x #"/")
                  (last x))
        tmp-password (random-url-safe-string 6)
        invite-id (-> (insert-invite tenant-conn
                                     {:author author-claims
                                      :email email
                                      :expire (c/to-sql-time (t/plus (t/now)
                                                                     (t/weeks 2)))})
                      first :id)

        text-part (selmer/render-file
                   "akvo/lumen/email/create_new_account_and_invite_to_tenant.txt"
                   {:author-name (get author-claims "name")
                    :email email
                    :invite-id invite-id
                    :location location
                    :tmp-password tmp-password})]
    (keycloak/reset-password keycloak request-headers user-id tmp-password)
    (emailer/send-email emailer [email] {"Subject" "Akvo Lumen invite"
                                         "Text-part" text-part})))

(defn create-invite
  "First check if user is already a member of current tenant, then don't invite.
  Then check if user has an account, if so invite to tenant. As a last resort
  setup an invitation to the provided email address for both an account and to
  the tenant."
  [emailer keycloak tenant-conn tenant location email author-claims]
  (cond
    (keycloak/tenant-member?
     keycloak tenant email) (lib/bad-request
                             {"reason" "Already tenant member"})
    (keycloak/user?
     keycloak email) (invite-to-tenant emailer tenant-conn location email
                                       author-claims)
    :else
    (create-new-account-and-invite-to-tenant
     emailer keycloak tenant-conn location email author-claims))
  (lib/ok {}))

(defn active-invites [tenant-conn]
  (lib/ok {:invites (select-active-invites tenant-conn)}))

(defn delete-invite [tenant-conn id]
  (if (zero? (first (delete-invite-by-id tenant-conn {:id id})))
    (lib/gone {})
    (lib/ok {})))

(defn verify-invite
  "Try and consume invite; Add user to keycloak; redirect to app."
  [keycloak tenant-conn tenant id location]
  (if-let [{:keys [email]} (first (consume-invite tenant-conn {:id id}))]
    (if-let [accepted (keycloak/add-user-with-email keycloak tenant email)]
      (lib/redirect location)
      (lib/unprocessable-entity (format "<html><body>%s</body></html>"
                                        "Problem completing your invite.")))
    (lib/unprocessable-entity "Could not verify invite.")))

(defn users
  [keycloak tenant]
  (keycloak/users keycloak tenant))

(defn remove-user
  [keycloak tenant author-claims user-id]
  (keycloak/remove-user keycloak tenant author-claims user-id))

(defn demote-user-from-admin
  [keycloak tenant author-claims user-id]
  (keycloak/demote-user-from-admin keycloak tenant author-claims user-id))

(defn promote-user-to-admin
  [keycloak tenant author-claims user-id]
  (keycloak/promote-user-to-admin keycloak tenant author-claims user-id))
