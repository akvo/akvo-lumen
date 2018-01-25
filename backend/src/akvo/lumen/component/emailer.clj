(ns akvo.lumen.component.emailer
  (:require [com.stuartsierra.component :as component]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.pprint :refer [pprint]]))

(defprotocol SendEmail
  (send-email [this recipients email] "Send email"))

(defrecord DevEmailer []

  component/Lifecycle
  (start [this]
    (println "Using dev emailer")
    this)
  (stop [this]
    this)

  SendEmail
  (send-email [this recipients email]
    (println "DevEmailer:")
    (pprint recipients)
    (pprint email)))

(defn dev-emailer
  "Emailer will pprint email."
  [options]
  (map->DevEmailer (select-keys options [:from-email :from-name])))

(defrecord MailJetEmailer [config]
  component/Lifecycle
  (start [this]
    this)

  (stop [this]
    this)

  SendEmail
  (send-email [{{credentials :credentials
                 api-root :api-url
                 from-email :from-email
                 from-name :from-name} :config}
               recipients
               email]
    (let [body (merge email
                      {"FromEmail" from-email
                       "FromName" from-name
                       "Recipients" (into []
                                          (map (fn [email] {"Email" email})
                                               recipients))})]
      (client/post (format "%s/send" api-root)
                   {:basic-auth credentials
                    :headers {"Content-Type" "application/json"}
                    :body (json/encode body)}))))

(defn mailjet-emailer
  [{:keys [email-user email-password from-email from-name mailjet-url]
    :or {mailjet-url "https://api.mailjet.com/v3"}}]
  (map->MailJetEmailer
   {:config {:credentials [email-user email-password]
             :from-email from-email
             :from-name from-name
             :api-url mailjet-url}}))
