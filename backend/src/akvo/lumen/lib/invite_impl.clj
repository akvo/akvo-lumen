(ns akvo.lumen.lib.invite-impl
  (:require [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.component.emailer :as emailer]
            [cheshire.core :as json]
            [clj-time.coerce :as c]
            [clj-time.core :as t]
            [clojure.string :as str]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response]]))

(hugsql/def-db-fns "akvo/lumen/lib/invite.sql")


(defn email-body
  [host random]
  (str/join "\n"
            ["Hi,"
             "You been invited to join a lumen tenant. Please visit the"
             "following link to complet your invitation:"
             (format "https://%s/verify/%s" host random)
             "Thanks"
             "Akvo"]))

(defn active-invites
  "Returns all active invites"
  [tenant-label tenant-conn keycloak claimed-roles]
  (response (select-active-invites tenant-conn)))

(defn do-create-invite [tenant-conn emailer keycloak email claims host]
  (if (keycloak/user? keycloak email)
    (let [expiration-time (c/to-sql-time (t/plus (t/now) (t/weeks 2)))
          db-rec (first (insert-invite tenant-conn
                                       {:email email
                                        :expiration_time expiration-time
                                        :author claims}))
          mail-body (email-body host (:id db-rec))]
      (emailer/send-email emailer mail-body))
    (prn (format "Tried to invite non existing user with email (%s)" email))))

(defn create
  "Creates a new invite"
  [tenant-conn emailer keycloak roles {:strs [email]} claims host]
  ;; If existing user and no other active invite on same email
  (do-create-invite tenant-conn emailer keycloak email claims host)
  (response {:invite-job-status "started"}))

(defn accept-invite
  ""
  [tenant-conn tenant emailer keycloak id]
  (if-let [{email :email} (first (consume-invite tenant-conn {:id id}))]
    (let [accept-status (keycloak/add-user-with-email keycloak tenant email)]
      (response {:accepted accept-status}))
    (do
      (prn (format "Tried to verify invite with id: %s" id))
      (response {:status 422
                 :body "Could not verify invite."}))))
