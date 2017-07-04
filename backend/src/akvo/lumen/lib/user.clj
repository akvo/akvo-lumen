(ns akvo.lumen.lib.user
  (:require [akvo.lumen.lib.user-impl :as impl]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Invites

(defn invite
  "Invite user with email to tenant."
  [emailer keycloak tenant-conn tenant server-name email author-claims]
  (impl/create-invite
   emailer keycloak tenant-conn tenant server-name email author-claims))

(defn invites
  "List active invites."
  [tenant-conn]
  (impl/active-invites tenant-conn))

(defn delete-invite
  "Deletes non consumed invites, returns 210 if invite was consumed and
  204 in any other case (both delete of actual invite or non existing).
  We don't want to delete invites that was used. This since we store who
  created the invite in the \"author\" db field, and this provides
  traceability. Hence we don't allow deletion of consumed invite."
  [tenant-conn id]
  (impl/delete-invite tenant-conn id))

(defn verify-invite
  "Add user to tenant."
  [keycloak tenant-conn tenant id location]
  (impl/verify-invite keycloak tenant-conn tenant id location))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Invites

(defn users
  "List users of tenant."
  [keycloak tenant]
  (impl/users keycloak tenant))

(defn remove-user
  "Remove user from tenant."
  [keycloak tenant author-claims user-id]
  (impl/remove-user keycloak tenant author-claims user-id))

(defn demote-user-from-admin
  "Demote existing user from admin."
  [keycloak tenant author-claims user-id]
  (impl/demote-user-from-admin keycloak tenant author-claims user-id))

(defn promote-user-to-admin
  "Demote existing user from admin."
  [keycloak tenant author-claims user-id]
  (impl/promote-user-to-admin keycloak tenant author-claims user-id))
