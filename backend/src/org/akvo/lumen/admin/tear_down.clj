(ns org.akvo.lumen.admin.tear-down
  (:require [clojure.java.jdbc :as jdbc]
            [org.akvo.lumen.admin.remove-tenant :refer (remove-tenant)]
            [org.akvo.lumen.admin.util :as util]))

(defn -main []
  (let [db-uri (util/db-uri)
        lumen-db-uri (util/db-uri {:database "lumen" :user "lumen"})
        labels (map :label
                    (jdbc/query lumen-db-uri
                                ["SELECT label FROM tenants"]))]
    (doseq [label labels]
      (remove-tenant label))
    (util/exec! db-uri "DROP DATABASE lumen")
    (util/exec! db-uri "DROP ROLE lumen")))
