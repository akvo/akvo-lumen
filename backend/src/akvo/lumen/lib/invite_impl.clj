(ns akvo.lumen.lib.invite-impl
  (:require [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.component.emailer :as emailer]
            [cheshire.core :as json]
            [clj-time.coerce :as c]
            [clj-time.core :as t]
            [clojure.string :as str]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response redirect]]))

(hugsql/def-db-fns "akvo/lumen/lib/invite.sql")

(defn dev-env? [server-name]
  (.contains '("t1.lumen.localhost" "t2.lumen.localhost") server-name))

(defn base-url
  [{:keys [server-name server-port]}]
  (if (dev-env? server-name)
    (format "http://%s:%s" server-name server-port)
    (format "https://%s" server-name)))

(defn email-body
  [request random]
  (str/join "\n"
            ["Hi,"
             ""
             "You been invited to join a lumen tenant. Please visit the"
             "following link to complete your invitation:"
             (format "%s/verify/%s" (base-url request) random)
             ""
             "Thanks"
             "Akvo"]))

(defn active-invites
  "Returns all active invites"
  [tenant-conn]
  (response (select-active-invites tenant-conn)))

(defn do-create-invite
  [tenant-conn emailer keycloak
   {{:strs [email]} :body claims :jwt-claims :as request}]
  (if (keycloak/user? keycloak email)
    (let [expiration-time (c/to-sql-time (t/plus (t/now) (t/weeks 2)))
          {id :id email-address :email}
          (first (insert-invite tenant-conn {:email email
                                             :expiration_time expiration-time
                                             :author claims}))
          email {:body (email-body request id)
                 :from "noreply@akvolumen.org"
                 :subject "Akvo Lumen invite"
                 :to email-address}]
      (emailer/send-email emailer email))
    (prn (format "Tried to invite non existing user with email (%s)" email))))

(defn create
  "Creates a new invite"
  [tenant-conn emailer keycloak request]
  ;; If existing user and no other active invite on same email
  (do-create-invite tenant-conn emailer keycloak request)
  (response {:invite "created"}))

(defn accept-invite
  ""
  [tenant-conn tenant emailer keycloak id {server-name :server-name}]
  (if-let [{email :email} (first (consume-invite tenant-conn {:id id}))]
    (if-let [accept-status (keycloak/add-user-with-email keycloak tenant email)]
      (if (dev-env? server-name)
        (redirect (format "http://%s:3030" server-name))
        (redirect "/"))
      (-> (response
           {:body (format "<html><body>%s</body></html>"
                          "Problem completing your invite.")
            :status 422})
          (assoc :headers {"Content-Type" "text/html"})))
    (do
      (prn (format "Tried to verify invite with id: %s" id))
      (response {:status 422
                 :body "Could not verify invite."}))))
