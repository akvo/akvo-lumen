(ns akvo.lumen.component.tenant-manager-test
  (:require [clojure.test :refer :all]
            [akvo.lumen.component.tenant-manager :as tenant-manager]))

(deftest ^:unit hostname->tenant
  (are [host expected-tenant] (= expected-tenant (tenant-manager/tenant-host host))
    "demo.akvolumen.org" "demo"
    "dark-demo.akvotest.org" "demo"
    "dark-dark-lumen.anything.org" "dark-lumen"
    "water-for-people.sub.sub.subdomain.com" "water-for-people"))
