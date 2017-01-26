(ns akvo.lumen.component.emailer
  (:require [com.stuartsierra.component :as component]
            [clojure.pprint :refer [pprint]]
            [postal.core :as postal]))

(defprotocol SendEmail
  (send-email [this email] "Send email"))




(defrecord DevMailer []

  component/Lifecycle
  (start [this]
    this)
  (stop [this]
    this)

  SendEmail
  (send-email [this email]
    (pprint email)))


(defrecord SMTPEmailer [host user password]

  component/Lifecycle
  (start [this]
    (println "@SMTPEmailer/start")
    this)
  (stop [this]
    (println "@SMTPEmailer/stop")
    this)

  SendEmail
  (send-email [this email]
    (println "Should send email via SMTP")
    (pprint this)
    (pprint email)))

(defn emailer
  [{:keys [email-host email-password email-user type] :as options}]
  (if (= type "dev")
    (DevMailer.)
    (let [email-host "mhost"
          email-user "muser"
          email-password "mpassword"]
      (map->SMTPEmailer {:host email-host
                         :user email-user
                         :password email-password}))))
