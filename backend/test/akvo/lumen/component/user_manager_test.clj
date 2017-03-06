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
            [clojure.set :as set]
            [clojure.test :refer :all]
            [cheshire.core :as json]
            [com.stuartsierra.component :as component]
            [duct.component.hikaricp :refer [hikaricp]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; System setup
;;;

(def seed-data
  (->> "seed.edn" io/resource slurp edn/read-string))

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


(defn fixture [f]
  (migrate-user-manager)
  (migrate-tenant test-tenant-spec)
  (alter-var-root #'test-system component/start)
  (binding [*tenant-conn* (tenant-manager/connection
                           (:tenant-manager test-system) "t1")
            *user-manager* (:user-manager test-system)]
    (f)
    (alter-var-root #'test-system component/stop)
    (rollback-tenant test-tenant-spec)))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Test data
;;;

(def author-claims
  {"name" "Jerome Eginla"})

(def ruth-email
  "ruth@t2.lumen.localhost")

(def tenant "t1")

(def server-name "t1.lumen.localhost")


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helpers
;;;

(defn- admin-and-members
  [keycloak tenant]
  (let [request-draft (keycloak/request-draft keycloak)
        admin-group-id (get (keycloak/group-by-path keycloak request-draft
                                                    (format "%s/admin" tenant))
                            "id")
        tenant-group-id (get (keycloak/group-by-path
                              keycloak request-draft tenant)
                             "id")]
    {:admin-ids (into #{}
                      (map #(get % "id"))
                      (keycloak/group-members keycloak request-draft
                                              admin-group-id))
     :member-ids (into #{}
                       (map #(get % "id"))
                       (keycloak/group-members keycloak request-draft
                                               tenant-group-id))}))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(use-fixtures :once fixture)

(deftest ^:functional create-delete-invite

  (testing "Create invite"
    (let [number-of-initial-invites (-> (user-manager/invites *user-manager*
                                                              *tenant-conn*)
                                        :body count)
          resp (user-manager/invite *user-manager* *tenant-conn* "t1"
                                    server-name ruth-email author-claims)]
      (is (= 204 (:status resp)))
      (is (= (inc number-of-initial-invites)
             (-> (user-manager/invites *user-manager*
                                       *tenant-conn*)
                 :body count)))))

  (testing "Delete invite"
    (let [number-of-initial-invites (-> (user-manager/invites *user-manager*
                                                              *tenant-conn*)
                                        :body count)
          invite-id (-> (user-manager/invites *user-manager* *tenant-conn*)
                        :body first :id)
          resp (user-manager/delete-invite *user-manager* *tenant-conn* invite-id)]
      (is (= 204 (:status resp)))
      (is (= (dec number-of-initial-invites)
             (-> (user-manager/invites *user-manager*
                                       *tenant-conn*)
                 :body count))))))


(deftest ^:functional full-user-life-cycle

  (testing "Invite user"

    (let [invite-resp (user-manager/invite *user-manager* *tenant-conn* "t1"
                                           server-name ruth-email author-claims)
          number-of-original-users (-> (user-manager/users *user-manager* "t1")
                                       :body count)
          invite-id (-> (user-manager/invites *user-manager* *tenant-conn*)
                        :body first :id)
          resp (user-manager/verify-invite *user-manager* *tenant-conn* "t1"
                                           invite-id)]
      (is (= 302 (:status resp)))
      (is (= "http://t1.lumen.localhost:3030"
             (get-in resp [:headers "Location"])))
      (is (= (inc number-of-original-users)
             (-> (user-manager/users *user-manager* "t1")
                 :body count)))
      (is (= 0 (-> (user-manager/invites *user-manager* *tenant-conn*)
                   :body count)))))

  (testing "Promote user"
    (let [{{api-root :api-root :as keycloak} :keycloak} *user-manager*
          admin-claims {"realm_access" {"roles" ["akvo:lumen:t1:admin"]}}
          request-draft (keycloak/request-draft keycloak)
          ruth-user (keycloak/fetch-user-by-email request-draft api-root ruth-email)
          resp (user-manager/promote-user-to-admin
                *user-manager* tenant admin-claims (get ruth-user "id"))]
      (is (= 200 (:status resp)))
      (is (= (get ruth-user "id")
             (-> resp :body (get "id"))))
      (is (-> resp :body (get "admin")))
      (let [{:keys [admin-ids member-ids]} (admin-and-members keycloak tenant)
            set-of-ruth  #{(get ruth-user "id")}]
        (is (not (empty? (set/intersection admin-ids set-of-ruth))))
        (is (empty? (set/intersection member-ids set-of-ruth))))))

  (testing "Demote user"
    (let [{{api-root :api-root :as keycloak} :keycloak} *user-manager*
          admin-claims {"realm_access" {"roles" ["akvo:lumen:t1:admin"]}}
          request-draft (keycloak/request-draft keycloak)
          ruth-user (keycloak/fetch-user-by-email request-draft api-root ruth-email)
          resp (user-manager/demote-user-from-admin
                *user-manager* tenant admin-claims (get ruth-user "id"))]
      (is (= 200 (:status resp)))
      (is (= (get ruth-user "id")
             (-> resp :body (get "id"))))
      #_(is (not (-> resp :body (get "admin"))))
      (let [{:keys [admin-ids member-ids]} (admin-and-members keycloak tenant)
            set-of-ruth #{(get ruth-user "id")}]
        (is (empty? (set/intersection admin-ids set-of-ruth)))
        (is (not (empty? (set/intersection member-ids set-of-ruth)))))))

  (testing "Remove user"
    (let [{{api-root :api-root :as keycloak} :keycloak} *user-manager*
          request-draft (keycloak/request-draft keycloak)
          ruth-user (keycloak/fetch-user-by-email request-draft api-root ruth-email)
          resp (user-manager/remove-user *user-manager* tenant author-claims
                                        (get ruth-user "id"))]
      (is (= 204 (:status resp)))
      (let [{:keys [admin-ids member-ids]} (admin-and-members keycloak tenant)
            set-of-ruth #{(get ruth-user "id")}]
        (is (empty? (set/intersection admin-ids set-of-ruth)))
        (is (empty? (set/intersection member-ids set-of-ruth)))))))
