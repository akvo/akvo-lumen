(ns akvo.lumen.admin.new-plan
  "The following env vars are assumed to be present:
  ENCRYPTION_KEY, PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD
  The PG_* env vars can be found in the ElephantSQL console for the appropriate
  instance.
  Arguments are tenant (label) and tier of new plan.
  Use this as follow
  $ env ENCRYPTION_KEY=*** \\
        PG_HOST=***.db.elephantsql.com PG_DATABASE=*** \\
        PG_USER=*** PG_PASSWORD=*** \\
        lein run -m akvo.lumen.admin.new-plan example-tenant standard"
  (:require [akvo.lumen.admin.util :refer [db-uri]]
            [akvo.lumen.config :refer [error-msg]]
            [clojure.java.jdbc :refer [print-sql-exception-chain
                                       with-db-transaction]]
            [environ.core :refer [env]]
            [akvo.lumen.db.tenant-manager :as db.tenant-manager]
            [ring.util.response :refer [response]])
  (:import [java.sql SQLException]
           [org.postgresql.util PGobject]))

(defn check-env-vars []
  (assert (:pg-database env) (error-msg "Specify PG_DATABASE env var"))
  (assert (:pg-host env) (error-msg "Specify PG_HOST env var"))
  (assert (:pg-password env) (error-msg "Specify PG_PASSWORD env var"))
  (assert (:pg-user env) (error-msg "Specify PG_USER env var")))

(defn exec [label]
  (let [tier "standard"]
   (try
     (check-env-vars)
     (with-db-transaction [tx (db-uri {:database "lumen" :user "lumen"})]
       (db.tenant-manager/end-tenant-plan tx {:label label})
       (db.tenant-manager/add-new-plan tx {:label label
                         :tier (doto (PGobject.)
                                 (.setType "tier")
                                 (.setValue tier))}))
     (println "Done!")
     (catch SQLException e
       (print-sql-exception-chain e)))))
