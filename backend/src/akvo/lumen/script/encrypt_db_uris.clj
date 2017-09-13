(ns akvo.lumen.script.encrypt-db-uris
  (:require [akvo.lumen.admin.util :as util]
            [akvo.lumen.lib.aes :as aes]
            [clojure.java.jdbc :as jdbc]))

(defn -main []
  (let [secret "secret"
        db (util/db-uri {:database "lumen"})
        tenants (jdbc/query db ["SELECT id, db_uri FROM tenants;"])]
    (doseq [tenant tenants]
      (util/exec! db "UPDATE tenants SET db_uri = '%s' WHERE id = %s" (aes/encrypt secret (:db_uri tenant)) (:id tenant)))))
