(ns akvo.lumen.lib.invite-impl
  (:require [hugsql.core :as hugsql]
            [akvo.lumen.component.keycloak :as keycloak]
            [ring.util.response :refer [not-found response]]))

(hugsql/def-db-fns "akvo/lumen/lib/invite.sql")

(defn active-invites
  "Returns all active invites"
  [tenant-label tenant-conn keycloak claimed-roles]

  )

(defn create
  "Creates a new invite"
  [tenant-conn keycloak roles body claims]
  [])

#_(defn accept-invite
  ""
  [tenant-conn keycloak id]
  [])
