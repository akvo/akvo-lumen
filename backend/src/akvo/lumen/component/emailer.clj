(ns akvo.lumen.component.emailer
  (:require [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.tools.logging :as log]
            [com.stuartsierra.component :as component]
            [integrant.core :as ig]))

(defprotocol SendEmail
  (send-email [this recipients email] "Send email"))

(defrecord DevEmailer []

  component/Lifecycle
  (start [this]
    (log/info  "Using std out emailer")
    this)
  (stop [this]
    this)

  SendEmail
  (send-email [this recipients email]
    (log/info recipients)
    (log/info email)))

(defn dev-emailer
  "Dev emailer logs email."
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
             :api-url "https://api.mailjet.com/v3"}}))


(defmethod ig/init-key :akvo.lumen.component.emailer/mailjet-emailer  [_ opts]
  (println "init-prod-emailer" :opts opts)
  (mailjet-emailer {})
  )

(defmethod ig/halt-key! :akvo.lumen.component.emailer/mailjet-emailer  [_ opts]
  (println "halt-dev-emailer" :opts opts)
  {})


(defmethod ig/init-key :akvo.lumen.component.emailer/dev-emailer  [_ opts]
  (println "init-dev-emailer" :opts opts)
  (dev-emailer {}))

(defmethod ig/halt-key! :akvo.lumen.component.emailer/dev-emailer  [_ opts]
  (println "halt-dev-emailer" :opts opts)
  {})


