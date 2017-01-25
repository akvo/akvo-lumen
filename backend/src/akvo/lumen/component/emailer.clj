(ns akvo.lumen.component.emailer
  (:require [com.stuartsierra.component :as component]
            [clojure.pprint :refer [pprint]]))

(defprotocol SendEmail
  (send-email [this email] "Send email"))


(defrecord DevMailer [config]

  component/Lifecycle
  (start [this]
    (println "@DevMail/start")
    this)
  (stop [this]
    (println "@DevMail/stop")
    this)

  SendEmail
  (send-email [this email]
    (pprint email)))


(defrecord SMTPEmailer [host user pass]

  component/Lifecycle
  (start [this]
    (println "@SMTPEmailer/start")
    this)
  (stop [this]
    (println "@SMTPEmailer/stop")
    this)

  SendEmail
  (send-email [this email]
    (println "Should send email via SMTP")))


(defn emailer [options]
  (condp = (:type options)
    "dev" (map->DevMailer {:config options})
    (map->SMTPEmailer {:host (:email-host options)
                       :user (:email-user options)
                       :password (:email-password options)})))
