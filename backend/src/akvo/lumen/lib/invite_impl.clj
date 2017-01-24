(ns akvo.lumen.lib.invite-impl
  (:require [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response]]))

(hugsql/def-db-fns "akvo/lumen/lib/invite.sql")

(defn active-invites
  "Returns all active invites"
  [tenant-conn]
  [])

(defn create
  "Creates a new invite"
  [tenant-conn body claims]
  [])

(defn accept-invite
  ""
  [tenant-conn id]
  [])
