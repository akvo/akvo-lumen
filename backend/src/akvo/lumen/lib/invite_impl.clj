(ns akvo.lumen.lib.invite-impl
  (:require [akvo.lumen.component.keycloak :as keycloak]
            [cheshire.core :as json]
            [clj-time.core :as t]
            [clj-time.coerce :as c]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response]]))

(hugsql/def-db-fns "akvo/lumen/lib/invite.sql")

(defn active-invites
  "Returns all active invites"
  [tenant-label tenant-conn keycloak claimed-roles]
  (response (select-active-invites tenant-conn)))

(defn do-create-invite [tenant-conn email claims]
  ;; create invite
  ;; email invite
  (let [expiration-time (c/to-sql-time (t/plus (t/now) (t/weeks 2)))
        db-rec (insert-invite tenant-conn
                              {:email email
                               :expiration_time expiration-time
                               :author claims})]
    (clojure.pprint/pprint db-rec)))

(defn create
  "Creates a new invite"
  [tenant-conn keycloak roles {:strs [email]} claims]
  ;; if not existing active invite on same email
  (do-create-invite tenant-conn email claims)
  (response {:invite-job-status "started"}))

#_(defn accept-invite
  ""
  [tenant-conn keycloak id]
  [])
