(ns akvo.lumen.component.emailer-test
  "Covers the two things the SMTP emailer does that postal does not: assembling
  the message from the protocol's (recipients, email) pair, and turning a
  rejected send into an exception."
  (:require [akvo.lumen.protocols :as p]
            [clojure.test :refer [deftest is testing]]
            [integrant.core :as ig]
            [postal.core :as postal]
            [akvo.lumen.component.emailer]))

(def emailer
  (ig/init-key :akvo.lumen.component.emailer/smtp-emailer
               {:host           "smtp.example.org"
                :port           587
                :email-user     "noreply@akvo.org"
                :email-password "secret"
                :ssl?           false
                :tls?           true
                :timeout        10000
                :from-email     "noreply@akvo.org"
                :from-name      "Akvo Lumen"}))

(deftest send-email-builds-the-message
  (let [sent (atom nil)]
    (with-redefs [postal/send-message (fn [server message]
                                        (reset! sent {:server server :message message})
                                        {:code 0 :error :SUCCESS :message "messages sent"})]
      (p/send-email emailer ["invitee@akvo.org"] {:subject "Akvo Lumen invite"
                                                  :body    "Follow this link"}))
    (testing "the sender comes from config, the recipients from the call"
      (is (= "Akvo Lumen <noreply@akvo.org>" (-> @sent :message :from)))
      (is (= ["invitee@akvo.org"] (-> @sent :message :to))))
    (testing "subject and body pass through untouched"
      (is (= "Akvo Lumen invite" (-> @sent :message :subject)))
      (is (= "Follow this link" (-> @sent :message :body))))
    (testing "ssl?/tls? reach postal under the names it expects"
      (is (true? (-> @sent :server :tls)))
      (is (false? (-> @sent :server :ssl))))))

(deftest send-email-raises-when-the-relay-rejects-the-message
  ;; postal signals a rejection by returning a value rather than throwing, so
  ;; without this a dropped message is indistinguishable from a delivered one.
  (with-redefs [postal/send-message (fn [_ _] {:code 99 :error :FAILURE :message "rejected"})]
    (is (thrown? clojure.lang.ExceptionInfo
                 (p/send-email emailer ["invitee@akvo.org"] {:subject "s" :body "b"})))))
