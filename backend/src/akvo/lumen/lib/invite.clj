(ns akvo.lumen.lib.invite
  (:require [akvo.lumen.lib.invite-impl :as impl]
            [akvo.lumen.auth :as auth]))

(defn active-invites
  "Returns all active invites"
  [& args]
  (apply impl/active-invites args))

(defn create
  "Creates a new invite"
  [& args]
  (apply impl/create args))

(defn accept-invite
  ""
  [& args]
  (apply impl/accept-invite args))

