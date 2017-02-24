(ns akvo.lumen.component.user-manager-test
  (:require [akvo.commons.psql-util]
            [akvo.lumen.fixtures :refer [migrate-tenant migrate-user-manager
                                         rollback-tenant test-tenant-spec]]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.lumen.component.user-manager :as user-manager]
            [akvo.lumen.component.emailer :as emailer]
            [akvo.lumen.component.keycloak :as keycloak]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.test :refer :all]
            [cheshire.core :as json]
            [com.stuartsierra.component :as component]
            [duct.component.hikaricp :refer [hikaricp]]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/component/user_manager_test.sql")

(def seed-data
  (->> "seed.edn" io/resource slurp edn/read-string))

(def author-claims
  {"name" "Jerome Eginla"})

(def ruth-email
  "ruth@t2.lumen.localhost")

(def keycloak-config
  {:url "http://localhost:8080/auth"
   :realm "akvo"
   :credentials
   {"client_id" "akvo-lumen-confidential"
    "client_secret" "caed3964-09dd-4752-b0bb-22c8e8ffd631"}})

(def test-system
  (->
   (component/system-map
    :db (hikaricp {:uri (-> seed-data :tenant-manager :db_uri)})
    :emailer (emailer/dev-emailer {})
    :keycloak (keycloak/keycloak keycloak-config)
    :tenant-manager (tenant-manager/tenant-manager {})
    :user-manager (user-manager/dev-user-manager {}))
   (component/system-using
    {:tenant-manager [:db]
     :user-manager [:emailer :keycloak]})))

(def ^:dynamic *tenant-conn*)
(def ^:dynamic *user-manager*)

;; (defn cleanup-keycloak []
;;   ;; Reset data or rebuild container???
;;   )

(defn fixture [f]
  #_(cleanup-keycloak)
  (migrate-user-manager)
  (migrate-tenant test-tenant-spec)
  (alter-var-root #'test-system component/start)
  (binding [*tenant-conn* (tenant-manager/connection
                           (:tenant-manager test-system) "t1")
            *user-manager* (:user-manager test-system)]
    (f)
    (alter-var-root #'test-system component/stop)
    (rollback-tenant test-tenant-spec)))

(use-fixtures :once fixture)

(deftest ^:functional user-invite

  (testing "No initial invites"
    (is (= 0 (-> (user-manager/invites *user-manager* *tenant-conn*)
                 :body count))))

  (testing "Create new invite"
    (let [server-name "t1.lumen.localhost"
          resp (user-manager/invite *user-manager* *tenant-conn* server-name
                                    ruth-email author-claims)]
      (is (= 200 (:status resp)))
      (is (= "created" (-> resp :body :invite)))))

  (testing "Invites after new created"
    (let [resp (user-manager/invites *user-manager* *tenant-conn*)]
      (is (= 200 (:status resp)))
      (is (= 1 (-> resp :body count)))
      (is (every? #(contains? (-> resp :body first) %)
                  [:id :email :created]))
      (is (= "ruth@t2.lumen.localhost"
             (-> resp :body first :email)))))

  ;; Work in progress - we need to clean Keycloak for these to work properly
  #_(testing "Accepting invite"
    (let [original-users (user-manager/users *user-manager* "t1")
          invite-id (-> (user-manager/invites *user-manager* *tenant-conn*)
                        :body first :id)]
      ;; Check inital state
      (is (= 2 (-> original-users :body count)))
      (is (not (contains?
                (set (map #(get % "email")
                          (-> original-users :body)))
                ruth-email)))
      ;; Verify invite
      (let [resp (user-manager/verify-invite
                  *user-manager* *tenant-conn* "t1" invite-id)]
        (is (= 302
               (:status resp)))
        (is (= "http://t1.lumen.localhost:3030"
               (get-in resp [:headers "Location"])))))))

