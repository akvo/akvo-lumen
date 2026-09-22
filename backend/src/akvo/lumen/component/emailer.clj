(ns akvo.lumen.component.emailer
  (:require [akvo.lumen.protocols :as p]
            [clojure.spec.alpha :as s]
            [integrant.core :as ig]
            [postal.core :as postal]))

;; =========================================================
;; Transactional email over SMTP
;; =========================================================
;;
;; See akvo/akvo-lumen#3197 for why this replaced the Mailjet v3 HTTP client.

(defrecord SmtpEmailer [server from]
  p/SendEmail
  (send-email [this recipients email]
    ;; postal reports a rejected message by *returning* {:error :FAILURE}
    ;; rather than throwing, so an unchecked call leaves a dropped message
    ;; and a delivered one looking identical to the caller - the exact
    ;; silent failure this component was rewritten to avoid. Raise instead,
    ;; which is also what the Mailjet client did on a non-2xx response, so
    ;; the error tracker keeps seeing send failures the way it always has.
    (let [{:keys [error] :as result} (postal/send-message
                                      server
                                      (assoc email :from from :to recipients))]
      (when-not (= :SUCCESS error)
        (throw (ex-info "Could not send email"
                        {:recipients recipients
                         :result result})))
      result)))

(defmethod ig/init-key :akvo.lumen.component.emailer/smtp-emailer
  [_ {:keys [host port email-user email-password ssl? tls? timeout from-email from-name]}]
  (map->SmtpEmailer
   {;; postal hands every key of this map that it does not consume itself
    ;; to JavaMail as a mail.smtp.* property, so it carries connection
    ;; settings and nothing else. Two of them are not literal property
    ;; names: :tls is rewritten to starttls.enable, and :ssl selects the
    ;; smtps protocol instead of becoming a property at all.
    :server {:host              host
             :port              port
             :user              email-user
             :pass              email-password
             :ssl               ssl?
             :tls               tls?
             ;; Strings, because these two reach JavaMail as properties and
             ;; it reads them back with Properties/getProperty, which yields
             ;; nil for a value that was not stored as a string. Without
             ;; them a hung relay holds the sending thread with no bound.
             :connectiontimeout (str timeout)
             :timeout           (str timeout)}
    :from (format "%s <%s>" from-name from-email)}))

(s/def ::host string?)
(s/def ::port pos-int?)
(s/def ::email-password string?)
(s/def ::email-user string?)
(s/def ::ssl? boolean?)
(s/def ::tls? boolean?)
(s/def ::timeout pos-int?)
(s/def ::from-email string?)
(s/def ::from-name string?)

(s/def ::emailer (partial satisfies? p/SendEmail))

(defmethod ig/pre-init-spec :akvo.lumen.component.emailer/smtp-emailer [_]
  (s/keys :req-un [::host ::port ::email-password ::email-user
                   ::ssl? ::tls? ::timeout ::from-email ::from-name]))
