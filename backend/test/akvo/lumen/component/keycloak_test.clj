(ns akvo.lumen.component.keycloak-test
  {:functional true}
  (:require
   [akvo.lumen.component.keycloak :as keycloak]
   [akvo.lumen.test-utils :as tu]
   [clj-time.coerce :as tc]
   [clj-time.core :as t]
   [akvo.lumen.protocols :as p]
   [clojure.test :refer :all]
   [integrant.core :as ig]))


(def ^:dynamic *keycloak*)

(defn fixture [f]
  (let [system (ig/init (tu/start-config)
                        [:akvo.lumen.component.keycloak/authorization-service])]
    (binding [*keycloak* (:akvo.lumen.component.keycloak/authorization-service system)]
      (f))
    (ig/halt! system)))

(use-fixtures :once fixture)

(deftest keycloak-test
  (testing "Jerome (admin) permissions to t1"
    (is (= #{"t1/admin"}
           (p/allowed-paths *keycloak* {:email "jerome@t1.akvolumen.org" :iat (tc/to-date (t/now))}))))

  (testing "Salim (member) permissions to t1"
    (is (= #{"t1"}
           (p/allowed-paths *keycloak* {:email "salim@t1.akvolumen.org" :iat (tc/to-date (t/now))}))))

  (testing "Non existing user"
    (is (= nil (p/allowed-paths *keycloak* {:email "nobody@t1.akvolumen.org" :iat (tc/to-date (t/now))} )))))
