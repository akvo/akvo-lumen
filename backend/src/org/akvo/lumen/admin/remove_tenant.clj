(ns org.akvo.lumen.admin.remove-tenant
  (:require [org.akvo.lumen.admin.util :as util]))

(defn remove-tenant [label]
  (let [tenant (str "tenant_" label)
        lumen-db-uri (util/db-uri {:database "lumen" :user "lumen"})]
    (util/exec! lumen-db-uri "DROP DATABASE %s" tenant)
    (util/exec! lumen-db-uri "DROP ROLE %s" tenant)
    (util/exec! lumen-db-uri "DELETE FROM tenants WHERE label='%s'" label)))

(defn -main [label]
  (remove-tenant label))
