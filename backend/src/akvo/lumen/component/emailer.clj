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
  (send-email [{:keys [host user pass]} to subject body]
    (let [options {:host host
                   :user user
                   :pass pass
                   :ssl true}
          message {:from "noreply@akvolumen.org"
                   :to to
                   :subject subject
                   :body body}]
      (postal/send-message options message))))

(defn emailer
  [{:keys [email-host email-password email-user type] :as options}]
  (if (= type "dev")
    (DevMailer.)
    (map->SMTPEmailer {:host email-host
                       :user email-user
                       :pass email-password})))
