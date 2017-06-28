(ns akvo.lumen.lib.user-test
  (:require [akvo.lumen.component.emailer :as emailer]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.component.tenant-manager :refer [pool]]
            [akvo.lumen.fixtures :refer [migrate-tenant rollback-tenant]]
            [akvo.lumen.lib.user :as user]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.test :refer :all]
            [com.stuartsierra.component :as component]
            [duct.component.hikaricp :refer [hikaricp]]
            [ragtime.jdbc :as rjdbc]
            [ragtime.repl :as rrepl]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helper fn
;;;




;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; System setup
;;;

(def seed-data
  (->> "test-seed.edn" io/resource slurp edn/read-string))

(def t1 (first (filter #(= "t1" (:label %))
                       (:tenants seed-data))))

(def test-system
  (-> (component/system-map
       :emailer (emailer/dev-emailer {})
       :keycloak (keycloak/keycloak keycloak-config))))

(def ^:dynamic *emailer*)
(def ^:dynamic *keycloak*)
(def ^:dynamic *tenant-conn*)

(defn fixture [f]
  (migrate-tenant t1)
  (alter-var-root #'test-system component/start)
  (binding [*emailer* (:emailer test-system)
            *keycloak* (:keycloak test-system)
            *tenant-conn* (pool t1)]
    (f)
    (alter-var-root #'test-system component/stop)))

(deftest ^:functional a-try

  (testing "Logic"
    (is (= 1 0))
    ))
