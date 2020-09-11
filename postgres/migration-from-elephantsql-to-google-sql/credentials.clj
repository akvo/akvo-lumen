(ns credentials)

(use 'akvo.lumen.lib.aes)
(use 'ring.util.codec)
(use 'clojure.walk)
(comment

  ;; This directory contains the scripts that we used to migrate Lumen from ElephantSQL to Google Cloud SQL

  ;; The following instructions probably do not work anymore but leaving it here as maybe they can be used for inspiration in the future.

  ;; Steps:

  ;; 1. Add to the docker-compose environment a Cloud Proxy so that we can connect to Google Cloud from your local box
  ;; 2. Start the docker-compose environment
  ;; 3. Run the RSR-migration container in k8s (https://github.com/akvo/akvo-rsr/blob/4c7867af49f0179c3ff6573bc0e9ca6a823b75e6/ci/k8s/db-migration/db-migration.yml#L41). Make sure it is pointing to the Lumen production database
  ;; 2. Stop Lumen, both dark and live

  (def elephant-uri "")
  (def encryption-key "")
  (def lumen-main-db "")
  (def lumen-main-user "")
  (def lumen-main-password "")
  (def google-cloud-uri (str "jdbc:postgres://localhost:5432/" lumen-main-db "?user=" lumen-main-user "&password=" lumen-main-password))

  ;; 3. create a creds file with all the user/passwords of the tentants databases. Copy the file from backend/creds.txt to postgres/creds.txt
  (spit "creds.txt"
    (str/join "\n"
      (cons
        (str lumen-main-db "," lumen-main-user "," lumen-main-password)
        (map
          (fn [x]
            (let [credentials (-> x
                                :db_uri
                                (#(decrypt encryption-key %))
                                (str/replace "jdbc:postgresql://" "https://")
                                (URL.)
                                .getQuery
                                form-decode
                                keywordize-keys
                                (select-keys [:user :password]))]
              (str (:user credentials) "," (:user credentials) "," (:password credentials))
              ))
          (clojure.java.jdbc/query elephant-uri "select * from tenants")))))

  ;; 4. Copy all scripts to k8s migration container:
  ;; kubectl cp postgres/ $(kubectl get pods -l "app=lumen-db-test-migration" -o jsonpath="{.items[0].metadata.name}"):/tmp -c rsr-db-migration
  ;; 5. Jump to the k8s box:
  ;; kubectl exec $(kubectl get pods -l "app=lumen-db-test-migration" -o jsonpath="{.items[0].metadata.name}") -it bash -c rsr-db-migration

  ;; 6. Do a dump
  ;; cd /tmp/postgres
  ;; bash dump-all-dbs.sh
  ;; 7. Restore all dumps:
  ;; bash restore-all-dbs.sh

  ;; 8. Update urls in Google SQL DB
  (map
    (fn [x]
      (let [credentials (-> x
                          :db_uri
                          (#(decrypt encryption-key %))
                          (str/replace "jdbc:postgresql://" "https://")
                          (URL.)
                          .getQuery
                          form-decode
                          keywordize-keys
                          (select-keys [:user :password]))
            new-jdbc-url (str "jdbc:postgresql://localhost:5432/"
                           (:user credentials)
                           "?user=" (:user credentials)
                           "&password=" (:password credentials))]
        (clojure.java.jdbc/execute! google-cloud-uri ["UPDATE tenants SET db_uri=? where db_uri=?" (encrypt encryption-key new-jdbc-url) (:db_uri x)])))
    (clojure.java.jdbc/query elephant-uri "select * from tenants"))

  ;; 9. Update the Lumen production database url credentials to the new Google ones
  ;; 10. Start Lumen, both dark and live.
  ;; 11. Stop the RSR-migration container
  )