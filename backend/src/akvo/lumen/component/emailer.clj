(ns akvo.lumen.component.emailer
  (:require [cheshire.core :as json]
            [clj-http.client :as client]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))

(defrecord DevEmailer []
  p/SendEmail
  (send-email [this recipients email]
    (log/info recipients)
    (log/info email)))

(defrecord MailJetV3Emailer [config]
  p/SendEmail
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

(defmethod ig/init-key :akvo.lumen.component.emailer/dev-emailer  [_ {:keys [from-email from-name] :as opts} ]
  (log/info  "Using std out emailer" opts)
  (map->DevEmailer opts))

(defmethod ig/init-key :akvo.lumen.component.emailer/mailjet-v3-emailer  [_ {:keys [email-password email-user from-email from-name]}]
  (map->MailJetV3Emailer
   {:config {:credentials [email-user email-password]
             :from-email  from-email
             :from-name   from-name}}))

(s/def ::email-password string?)
(s/def ::email-user string?)
(s/def ::from-email string?)
(s/def ::from-name string?)

(s/def ::emailer (partial satisfies? p/SendEmail))

(defmethod integrant-key :akvo.lumen.component.emailer/dev-emailer [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::from-email ::from-name])))


(defmethod integrant-key :akvo.lumen.component.emailer/mailjet-v3-emailer [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::email-password ::email-user ::from-email ::from-name])))
