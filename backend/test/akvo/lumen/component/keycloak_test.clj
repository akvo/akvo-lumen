(ns akvo.lumen.component.keycloak-test
  {:functional true}
  (:require
   [akvo.lumen.component.keycloak :as keycloak]
   [akvo.lumen.test-utils :as tu]
   [clojure.test :refer :all]
   [integrant.core :as ig]))


(def ^:dynamic *keycloak*)

(defn fixture [f]
  (let [system (ig/init (tu/start-config)
                        [:akvo.lumen.component.keycloak/keycloak])]
    (binding [*keycloak* (:akvo.lumen.component.keycloak/keycloak system)]
      (f))
    (ig/halt! system)))

(use-fixtures :once fixture)

(deftest keycloak-test
  (testing "Jerome (admin) permissions to t1"
    (is (= #{"t1/admin"}
           (keycloak/allowed-paths *keycloak* "jerome@t1.lumen.localhost"))))

  (testing "Salim (member) permissions to t1"
    (is (= #{"t1"}
           (keycloak/allowed-paths *keycloak* "salim@t1.lumen.localhost"))))

  (testing "Non existing user"
    (is (thrown? Exception (keycloak/allowed-paths *keycloak* "nobody@t1.lumen.localhost"))))

  #_(testing "Timeout Keycloak"
    (is (thrown? java.util.concurrent.TimeoutException
                 (keycloak/allowed-paths *keycloak* "jerome@t1.lumen.localhost" {:timeout 0})))))
