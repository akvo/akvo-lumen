(ns org.akvo.lumen.admin.tear-down
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.string :as s]
            [environ.core :refer [env]]
            [org.akvo.lumen.admin.remove-tenant :refer (remove-tenant)]
            [org.akvo.lumen.util :refer [squuid]]
            [ragtime.jdbc]
            [ragtime.repl]))

(defn -main []
  (let [{pg-host :pghost
         pg-database :pgdatabase
         pg-user :pguser
         pg-password :pgpassword} env
        db-uri (format "jdbc:postgresql://%s/%s?user=%s&password=%s"
                       pg-host pg-database pg-user pg-password)
        lumen-db-uri (format "jdbc:postgresql://%s/lumen?user=lumen&password=%s"
                             pg-host pg-password)
        exec! (fn [db-uri format-str & args]
                (jdbc/execute! db-uri
                               [(apply format format-str args)]
                               {:transaction? false}))
        labels (map :label
                    (jdbc/query lumen-db-uri
                                ["SELECT label FROM tenants"]))]
    (doseq [label labels]
      (remove-tenant pg-host pg-password label))
    (exec! db-uri "DROP DATABASE lumen")
    (exec! db-uri "DROP ROLE lumen")))
