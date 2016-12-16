(ns akvo.lumen.admin.remove-tenant
  (:require [akvo.lumen.admin.util :as util]))

;; The following env vars are assumed to be present:
;; PGHOST,  PGDATABASE, PGUSER, PGPASSWORD
;; These can be found in the ElephantSQL console for the appropriate instance
;; Use this as follow
;; $ env PGHOST=***.db.elephantsql.com PGDATABASE=*** PGUSER=*** PGPASSWORD=*** \
;;     lein run -m akvo.lumen.admin.remove-tenant <label>

(defn remove-tenant [label]
  (let [tenant (str "tenant_" label)
        lumen-db-uri (util/db-uri {:database "lumen" :user "lumen"})]
    (util/exec! lumen-db-uri "DROP DATABASE %s" tenant)
    (util/exec! lumen-db-uri "DROP ROLE %s" tenant)
    (util/exec! lumen-db-uri "DELETE FROM tenants WHERE label='%s'" label)))

(defn -main [label]
  (remove-tenant label))
