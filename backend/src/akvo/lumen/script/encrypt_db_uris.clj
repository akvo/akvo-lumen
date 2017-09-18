(ns akvo.lumen.script.encrypt-db-uris
  "This script is the part of https://github.com/akvo/akvo-lumen/issues/1006
  The following env vars are assumed to be present:
  ENCRYPTION_KEY, PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD
  ENCRYPTION_KEY is a key specific for the environment used for encrypting
  the db_uri. The PG_* env vars can be found in the ElephantSQL console for the
  appropriate instance.
  Use this as follow
  $ env ENCRYPTION_KEY=*** \\
        PG_HOST=***.db.elephantsql.com PG_DATABASE=*** \\
        PG_USER=*** PG_PASSWORD=*** \\
        lein run -m akvo.lumen.admin.script.encrypt-db-uris
  This script will not run on OS X with a standard jvm if longer encryption keys
  than 16 bytes are used. Alternatives are to \"fix\" jvm on OS X or to run the
  script on Linux in a Docker container."
  (:require [akvo.lumen.admin.util :as util]
            [akvo.lumen.lib.aes :as aes]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as s]
            [environ.core :refer [env]]))

(defn -main []
  (let [secret (:encryption-key env)
        db (util/db-uri {:database "lumen"})
        tenants (jdbc/query db ["SELECT id, db_uri FROM tenants;"])]
    (doseq [{:keys [db_uri id]} tenants]
      (when (s/starts-with? db_uri "jdbc:postgresql://")
        (util/exec! db "UPDATE tenants SET db_uri = '%s' WHERE id = %s" (aes/encrypt secret db_uri) id)))))
