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

(defrecord MailJetEmailer [config]
  SendEmail
  (send-email [{{credentials :credentials
                 api-root    :api-url
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
      (client/post (format "%s/send" api-root)
                   {:basic-auth credentials
                    :headers    {"Content-Type" "application/json"}
                    :body       (json/encode body)}))))

(defmethod ig/init-key :akvo.lumen.component.emailer/mailjet-emailer  [_ {:keys [config] :as opts}]
  (let [{:keys [email-user email-password from-email from-name mailjet-url]
         :or   {mailjet-url "https://api.mailjet.com/v3"}} (-> config :emailer)]
   (map->MailJetEmailer
    {:config {:credentials [email-user email-password]
              :from-email  from-email
              :from-name   from-name
              :api-url     mailjet-url}})))

(defmethod ig/init-key :akvo.lumen.component.emailer/dev-emailer  [_ {:keys [config] :as opts}]
  (log/info  "Using std out emailer")
  (map->DevEmailer (select-keys (:emailer config) [:from-email :from-name])))
