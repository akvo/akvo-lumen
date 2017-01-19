(ns akvo.lumen.lib.user-impl
  (:require [ring.util.response :refer [not-found response]]))

;; Where do we enforce admin rights?

(defn all [tenant]
  (prn tenant)
  (response []))


;; (defn get
;;   "Gets all users or an individual user with the given id"
;;   [tenant & [id]])

;; (defn send-email!
;;   "Send an email - this should be a generic helper function elsewhere"
;;   [to cc bcc subject body])

;; (defn create!
;;   "Create a new user from the given email address and send both the new user
;;   and the admin user a confirmation email"
;;   [tenant email]
;;   ; (create-user)
;;   (send-email! [email] [] [admin-email]
;;                "User successfully created"
;;                "Message body"))
