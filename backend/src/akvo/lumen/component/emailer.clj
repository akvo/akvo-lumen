(ns akvo.lumen.component.emailer
  (:require [com.stuartsierra.component :as component]
            [clojure.pprint :refer [pprint]]
            [postal.core :as postal]))

(defn email? [email]
  (let [ks [:body :from :subject :to]]
    (every? #(contains? email %) ks)))

(defprotocol SendEmail
  (send-email [this email] "Send email"))

(defrecord DevEmailer []

  component/Lifecycle
  (start [this]
    this)
  (stop [this]
    this)

  SendEmail
  (send-email [this email]
    (assert (email? email) "Not a proper email (:body :from :subject :to)")
    (pprint email)))


(defrecord SMTPEmailer [config]

  component/Lifecycle
  (start [this]
    this)
  (stop [this]
    this)

  SendEmail
  (send-email [{config :config} email]
    (postal/send-message config email)))

(defn dev-emailer
  "Emailer will pprint email. Included link will be https."
  [options]
  (->DevEmailer))

(defn smtp-emailer
  [{:keys [email-host email-password email-user]}]
  (map->SMTPEmailer {:config {:host email-host
                              :pass email-password
                              :ssl true
                              :user email-user}}))
