(ns akvo.lumen.component.emailer
  (:require [com.stuartsierra.component :as component]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.pprint :refer [pprint]]
            [postal.core :as postal]))

(defn email? [email]
  (let [ks [:body :from :subject :to]]
    (every? #(contains? email %) ks)))

(defprotocol ISendEmail
  (send-email [this email] "Send email"))

(defrecord DevEmailer []

  component/Lifecycle
  (start [this]
    this)
  (stop [this]
    this)

  ISendEmail
  (send-email [this email]
    (assert (email? email) "Not a proper email (:body :from :subject :to)")
    (pprint email)))

(defn dev-emailer
  "Emailer will pprint email. Included link will be https."
  [options]
  (->DevEmailer))

(defrecord SMTPEmailer [config]

  component/Lifecycle
  (start [this]
    this)
  (stop [this]
    this)

  ISendEmail
  (send-email [{config :config} email]
    (postal/send-message config email)))

(defn smtp-emailer
  [{:keys [email-host email-password email-user]}]
  (map->SMTPEmailer {:config {:host email-host
                              :pass email-password
                              :ssl true
                              :user email-user}}))

(defrecord MailJetEmailer [config]
  component/Lifecycle
  (start [this]
    this)

  (stop [this]
    this)

  ISendEmail
  (send-email [{{credentials :credentials api-root :api-url} :config}
               {:keys [body from subject to]}]
    (let [url (format "%s/send" api-root)
          body-data {"FromEmail" from
                     "FromName" "Akvo Lumen"
                     "Subject" subject
                     "Text-part" body
                     ;; "Html-part" "<h3>Sending emails</h3>"
                     ;; this https://app.mailjet.com/docs/emails_content
                     "Recipients" [{"Email" to}]}]
      (client/post url
                   {:basic-auth credentials
                    :headers {"Content-Type" "application/json"}
                    :body (json/encode body-data)}))))

(defn mailjet-emailer
  [{:keys [email-public-key email-private-key]}]
  (map->MailJetEmailer
   {:config {:credentials [email-public-key email-private-key]
             :api-url "https://api.mailjet.com/v3"}}))
