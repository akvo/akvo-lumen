(ns akvo.lumen.component.emailer
  (:require [com.stuartsierra.component :as component]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.pprint :refer [pprint]]))

(defprotocol ISendEmail
  (send-email [this recipients email] "Send email"))

(defrecord DevEmailer []

  component/Lifecycle
  (start [this]
    (println "Using dev emailer")
    this)
  (stop [this]
    this)

  ISendEmail
  (send-email [this recipients email]
    (println "DevEmailer:")
    (pprint recipients)
    (pprint email)
    (println "---")))

(defn dev-emailer
  "Emailer will pprint email."
  [options]
  (->DevEmailer))

(defrecord MailJetEmailer [config]
  component/Lifecycle
  (start [this]
    this)

  (stop [this]
    this)

  ISendEmail
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
  [{:keys [email-user email-password from-email from-name]}]
  (map->MailJetEmailer
   {:config {:credentials [email-user email-password]
             :from-email from-email
             :from-name from-name
             :api-url "https://api.mailjet.com/v3"}}))
