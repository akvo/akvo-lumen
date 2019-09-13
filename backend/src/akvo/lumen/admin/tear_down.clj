(ns akvo.lumen.admin.tear-down
  (:require [akvo.lumen.admin.remove-tenant]
            [akvo.lumen.admin.util :as util]
            [clojure.java.jdbc :as jdbc]))

;; The following env vars are assumed to be present:
;; PGHOST,  PGDATABASE, PGUSER, PGPASSWORD
;; These can be found in the ElephantSQL console for the appropriate instance
;; Use this as follow
;; $ env PGHOST=***.db.elephantsql.com PGDATABASE=*** PGUSER=*** PGPASSWORD=*** \
;;     lein run -m akvo.lumen.admin.tear-down

(defn -main []
  #_(let [db-uri (util/db-uri)
          lumen-db-uri (util/db-uri {:database "lumen" :user "lumen"})
          labels (map :label
                      (jdbc/query lumen-db-uri
                                  ["SELECT label FROM tenants"]))]
      (doseq [label labels]
        (remove-tenant label))
      (util/exec! db-uri {} "DROP DATABASE lumen")
      (util/exec! db-uri {} "DROP ROLE lumen")))
