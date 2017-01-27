(ns akvo.lumen.component.emailer
  (:require [com.stuartsierra.component :as component]
            [clojure.pprint :refer [pprint]]
            [postal.core :as postal]))

(defprotocol SendEmail
  (send-email [this to subject body] "Send email"))

(defrecord DevMailer []

  component/Lifecycle
  (start [this]
    this)
  (stop [this]
    this)

  SendEmail
  (send-email [this to subject body]
    (pprint {:to to
             :subject subject
             :body body})))


(defrecord SMTPEmailer [host user pass]

  component/Lifecycle
  (start [this]
    (println "@SMTPEmailer/start")
    this)
  (stop [this]
    (println "@SMTPEmailer/stop")
    this)

  SendEmail
  (send-email [{:keys [host pass user]} to subject body]
    (let [options {:host host
                   :pass pass
                   :ssl true
                   :user user}
          message {:body body
                   :from "noreply@akvolumen.org"
                   :subject subject
                   :to to}]
      (postal/send-message options message))))

(defn emailer
  [{:keys [email-host email-password email-user type] :as options}]
  (if (= type "dev")
    (DevMailer.)
    (map->SMTPEmailer {:host email-host
                       :pass email-password
                       :user email-user})))
