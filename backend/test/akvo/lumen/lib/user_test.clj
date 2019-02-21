(ns akvo.lumen.lib.user-test
  {:functional true}
  (:require [akvo.lumen.component.emailer :as emailer]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.fixtures :refer [migrate-tenant]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.user :as user]
            [akvo.lumen.test-utils :refer [seed-data test-tenant test-tenant-conn] :as tu]
            [akvo.lumen.endpoint.commons.variant :as variant]
            [clojure.set :as set]
            [clojure.test :refer :all]
            [integrant.core :as ig]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; System setup
;;;

(def keycloak-config (:keycloak seed-data))

(def test-system
  {:emailer {}
   :keycloak {}})

(def ^:dynamic *emailer*)
(def ^:dynamic *keycloak*)
(def ^:dynamic *tenant-conn*)

(defn fixture [f]
  (migrate-tenant test-tenant)
  (binding [*emailer* (ig/init-key :akvo.lumen.component.emailer/dev-emailer {:config {:from-email "" :from-name ""}})
            *keycloak* (ig/init-key :akvo.lumen.component.keycloak keycloak-config)
            *tenant-conn* (test-tenant-conn test-tenant)]
    (f)))

(use-fixtures :once fixture tu/spec-instrument)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(def author-claims {"name" "Jerome Eginla"})
(def ruth-email  "ruth@t2.lumen.localhost")
(def server-name "t1.lumen.localhost")
(def tenant "t1")


(defn- admin-and-members
  [keycloak tenant]
  (let [request-headers (keycloak/request-headers keycloak)
        admin-group-id (get (keycloak/group-by-path
                             keycloak request-headers (format "%s/admin" tenant))
                            "id")
        tenant-group-id (get (keycloak/group-by-path
                              keycloak request-headers tenant)
                             "id")]
    {:admin-ids (into #{}
                      (map #(get % "id"))
                      (keycloak/group-members keycloak request-headers admin-group-id))
     :member-ids (into #{}
                       (map #(get % "id"))
                       (keycloak/group-members keycloak request-headers tenant-group-id))}))

(deftest ^:functional create-delete-invite
  (testing "Create invite"
    (let [number-of-initial-invites (-> (user/active-invites  *tenant-conn*)
                                        variant/value :invites count)
          resp (user/create-invite *emailer* *keycloak* *tenant-conn* "t1"
                                   server-name ruth-email author-claims)]
      (is (= ::lib/ok (variant/tag resp)))
      (is (= (inc number-of-initial-invites)
             (-> (user/active-invites *tenant-conn*)
                 variant/value :invites count)))))

  (testing "Delete invite"
    (let [number-of-initial-invites (-> (user/active-invites *tenant-conn*)
                                        variant/value :invites count)
          invite-id (-> (user/active-invites *tenant-conn*)
                        variant/value :invites first :id)
          resp (user/delete-invite *tenant-conn* invite-id)]
      (is (= ::lib/ok (variant/tag resp)))
      (is (= (dec number-of-initial-invites)
             (-> (user/active-invites *tenant-conn*)
                 variant/value :invites count))))))


(deftest ^:functional full-user-life-cycle

  (testing "Invite user"

    (let [invite-resp (user/create-invite *emailer* *keycloak* *tenant-conn* "t1"
                                   server-name ruth-email author-claims)
          number-of-original-users (-> (user/users *keycloak* "t1")
                                       variant/value :users count)
          invite-id (-> (user/active-invites *tenant-conn*)
                        variant/value :invites first :id)
          resp (user/verify-invite *keycloak* *tenant-conn* "t1" invite-id
                                   "http://t1.lumen.localhost:3030")]
      (is (= ::lib/redirect (variant/tag resp)))
      (is (= "http://t1.lumen.localhost:3030"
             (variant/value resp)))
      (is (= (inc number-of-original-users)
             (-> (user/users *keycloak* "t1")
                 variant/value :users count)))))

  (testing "Promote user"
    (let [{api-root :api-root :as keycloak} *keycloak*
          admin-claims {"realm_access" {"roles" ["akvo:lumen:t1:admin"]}}
          request-headers (keycloak/request-headers keycloak)
          ruth-user (keycloak/fetch-user-by-email request-headers api-root ruth-email)
          resp (user/promote-user-to-admin *keycloak* tenant admin-claims (get ruth-user "id"))]
      (is (= ::lib/ok (variant/tag resp)))
      (is (= (get ruth-user "id")
             (-> resp variant/value (get "id"))))
      (is (-> resp variant/value (get "admin")))
      (let [{:keys [admin-ids member-ids]} (admin-and-members keycloak tenant)
            set-of-ruth  #{(get ruth-user "id")}]
        (is (not (empty? (set/intersection admin-ids set-of-ruth))))
        (is (empty? (set/intersection member-ids set-of-ruth))))))

  (testing "Demote user"
    (let [{api-root :api-root :as keycloak} *keycloak*
          admin-claims {"realm_access" {"roles" ["akvo:lumen:t1:admin"]}}
          request-headers (keycloak/request-headers keycloak)
          ruth-user (keycloak/fetch-user-by-email request-headers api-root ruth-email)
          resp (user/demote-user-from-admin *keycloak* tenant admin-claims (get ruth-user "id"))]
      (is (= ::lib/ok (variant/tag resp)))
      (is (= (get ruth-user "id")
             (-> resp variant/value (get "id"))))
      #_(is (not (-> resp :body (get "admin"))))
      (let [{:keys [admin-ids member-ids]} (admin-and-members keycloak tenant)
            set-of-ruth #{(get ruth-user "id")}]
        (is (empty? (set/intersection admin-ids set-of-ruth)))
        (is (not (empty? (set/intersection member-ids set-of-ruth)))))))

  (testing "Remove user"
    (let [{api-root :api-root :as keycloak} *keycloak*
          request-headers (keycloak/request-headers keycloak)
          ruth-user (keycloak/fetch-user-by-email request-headers api-root ruth-email)
          resp (user/remove-user *keycloak* tenant author-claims (get ruth-user "id"))]
      (is (= ::lib/ok (variant/tag resp)))
      (let [{:keys [admin-ids member-ids]} (admin-and-members keycloak tenant)
            set-of-ruth #{(get ruth-user "id")}]
        (is (empty? (set/intersection admin-ids set-of-ruth)))
        (is (empty? (set/intersection member-ids set-of-ruth)))))))
