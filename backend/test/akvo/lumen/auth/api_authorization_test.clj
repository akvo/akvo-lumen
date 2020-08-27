(ns akvo.lumen.auth.api-authorization-test
  (:require [akvo.lumen.auth.api-authorization :as m]
            [clojure.test :refer [deftest testing is]]))

(deftest ^:unit api-tenant-admin?-test
  (let [tf (fn [cxt tenant allowed-paths bool]
             (testing cxt
               (is (= bool (m/api-tenant-admin? tenant allowed-paths)))))]

    (tf "Nil case"
        "demo" nil false)
    (tf "No allowed paths"
        "demo" #{} false)
    (tf "A user on the tenant"
        "demo" #{"demo" "t1"} false)
    (tf "A user on another tenant"
        "demo" #{"t1"} false)
    (tf "An admin on another tenant"
        "demo" #{"t1/admin"} false)
    (tf "An admin"
        "demo" #{"demo/admin"} true)))
