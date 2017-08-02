(ns akvo.lumen.admin.add-plan
  "The following env vars are assumed to be present:
  PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD
  The PG_* env vars can be found in the ElephantSQL console for the appropriate
  instance.
  Arguments are tenant (label) and tier of new plan.
  Use this as follow
  $ env PG_HOST=***.db.elephantsql.com PG_DATABASE=*** \\
        PG_USER=*** PG_PASSWORD=*** \\
        lein run -m akvo.lumen.admin.add-plan example-tenant standard"
  (:require [akvo.lumen.admin.util :as util]
            [akvo.lumen.config :refer [error-msg]]
            [clojure.java.jdbc :as jdbc]
            [environ.core :refer [env]]))

(defn check-env-vars []
  (assert (:pg-database env) (error-msg "Specify PG_DATABASE env var"))
  (assert (:pg-host env) (error-msg "Specify PG_HOST env var"))
  (assert (:pg-password env) (error-msg "Specify PG_PASSWORD env var"))
  (assert (:pg-user env) (error-msg "Specify PG_USER env var")))

(defn fetch-tenant-db-uri
  "Lookup jdbc connection string for a tenant label in the lumen database
  (provided by env vars)."
  [label]
  (-> (jdbc/query (format "jdbc:postgres://%s:5432/%s?user=%s&password=%s"
                          (:pg-host env) (:pg-database env)
                          (:pg-user env) (:pg-password env))
                  ["SELECT db_uri FROM tenants WHERE label = ?" label])
      first :db_uri))

(defn set-new-plan!
  "First verifies that the tier of the new plan is a valid one, and then add the
  new plan on provided tier."
  [tenant-db-uri tier]
  (if-let [_ (first (jdbc/query tenant-db-uri
                                ["SELECT id FROM tier WHERE title = ?" tier]))]
    (util/exec! tenant-db-uri
                (str "INSERT INTO plan (tier) "
                     "SELECT id FROM tier "
                     "WHERE title = '%1$s';")
                tier)
    (println "Tier is not valid")))

(defn -main [label tier]
  (try
    (check-env-vars)
    (if-let [tenant-db-uri (fetch-tenant-db-uri label)]
      (set-new-plan! tenant-db-uri tier)
      (println "Could not find tenant with provided label."))
    (println "Done!")
    (catch java.lang.AssertionError e
      (prn (.getMessage e)))
    (catch Exception e
      (prn e)
      (prn (.getMessage e))
      (when (= (type e) clojure.lang.ExceptionInfo)
        (prn (ex-data e))))))
