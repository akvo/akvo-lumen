(ns akvo.lumen.component.emailer
  (:require [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))

(defprotocol SendEmail
  (send-email [this recipients email] "Send email"))

(defrecord DevEmailer []
  SendEmail
  (send-email [this recipients email]
    (log/info recipients)
    (log/info email)))

(defrecord MailJetV3Emailer [config]
  SendEmail
  (send-email [{{credentials :credentials
                 from-email  :from-email
                 from-name   :from-name} :config}
               recipients
               email]
    (let [body (merge email
                      {"FromEmail"  from-email
                       "FromName"   from-name
                       "Recipients" (into []
                                          (map (fn [email] {"Email" email})
                                               recipients))})]
      (client/post "https://api.mailjet.com/v3/send"
                   {:basic-auth credentials
                    :headers    {"Content-Type" "application/json"}
                    :body       (json/encode body)}))))

(defmethod ig/init-key :akvo.lumen.component.emailer/dev-emailer  [_ {:keys [config] :as opts}]
  (log/info  "Using std out emailer")
  (map->DevEmailer (select-keys (:emailer config) [:from-email :from-name])))

(defmethod ig/init-key :akvo.lumen.component.emailer/mailjet-v3-emailer  [_ {:keys [config]}]
  (let [{:keys [email-password email-user from-email from-name]} (-> config :emailer)]
    (map->MailJetV3Emailer
     {:config {:credentials [email-user email-password]
               :from-email  from-email
               :from-name   from-name}})))
