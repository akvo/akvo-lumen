(ns akvo.lumen.lib.invite
  (:require [akvo.lumen.lib.invite-impl :as impl]))

(defn active-invites
  "Returns all active invites"
  [tenant-conn]
  (impl/active-invites tenant-conn))

(defn create
  "Creates a new invite"
  [tenant-conn body claims]
  (impl/create tenant-conn body claims))

(defn accept-invite
  ""
  [tenant-conn id]
  (impl/accept-invite tenant-conn id))
