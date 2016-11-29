(ns org.akvo.lumen.admin.remove-tenant
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as s]
            [environ.core :refer [env]]
            [org.akvo.lumen.util :refer [squuid]]
            [ragtime.jdbc]
            [ragtime.repl]))

(defn remove-tenant [pg-host pg-password label]
  (let [tenant (str "tenant_" label)
        lumen-db-uri (format "jdbc:postgresql://%s/lumen?user=lumen&password=%s"
                             pg-host pg-password)
        exec! (fn [db-uri format-str & args]
                (jdbc/execute! db-uri
                               [(apply format format-str args)]
                               {:transaction? false}))]
    (exec! lumen-db-uri "DROP DATABASE %s" tenant)
    (exec! lumen-db-uri "DROP ROLE %s" tenant)
    (exec! lumen-db-uri "DELETE FROM tenants WHERE label='%s'" label)))

(defn -main [label]
  (let [{pg-host :pghost
         pg-password :pgpassword} env]
    (remove-tenant pg-host pg-password label)))
