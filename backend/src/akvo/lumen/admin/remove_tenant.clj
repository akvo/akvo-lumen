(ns akvo.lumen.admin.remove-tenant
  "The following env vars are assumed to be present:
  KC_URL, KC_SECRET, PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD
  ENCRYPTION_KEY is a key specific for the Kubernetes environment used for
  encrypting the db_uri.
  The PG_* env vars can be found in the ElephantSQL console for the appropriate
  instance. KC_URL is the url to keycloak (without trailing /auth).
  KC_SECRET is the client secret found in the Keycloak admin at
  > Realms > Akvo > Clients > akvo-lumen-confidential > Credentials > Secret.
  Use this as follow
  $ env ENCRYPTION_KEY=*** \\
  KC_URL=https://*** KC_SECRET=*** \\
  PG_HOST=***.db.elephantsql.com PG_DATABASE=*** \\
  PG_USER=*** PG_PASSWORD=*** \\
  lein run -m akvo.lumen.admin.remove-tenant label
  KC_URL is probably one of:
  - http://localhost:8080 for local development
  - https://login.akvo.org for production
  - https://kc.akvotest.org for the test environment

  It's not possible to delete a database if open connections exist, workaround:
  https://dba.stackexchange.com/questions/11893/force-drop-db-while-others-may-be-connected"
  (:require [akvo.lumen.admin.util :as util]
            [akvo.lumen.admin.db :as admin.db]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.http.client :as http.client]
            [akvo.lumen.admin.keycloak :as admin.keycloak]
            [akvo.lumen.admin.system :as admin.system]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]
            [clojure.string :as str]
            [cheshire.core :as json]))

(defn exec [{:keys [authorizer dbs]} label]
  (binding [admin.db/env-vars (:root dbs)]
    (let [tenant (str "tenant_" (str/replace label "-" "_"))
         db-uris (admin.db/db-uris label nil (-> dbs :lumen :password))]
     (admin.db/drop-tenant-database label db-uris)
     (admin.keycloak/remove-tenant authorizer label)
     true)))

(defn -main [label & [edn-file]]
  (printf "Are you sure you want to remove tenant \"%s\" ('Yes' | 'No')? " label)
  (flush)
  (if (= (read-line) "Yes")    
    (binding [keycloak/http-client-req-defaults (http.client/req-opts 50000)]
      (admin.system/ig-derives)
      (let [admin-system (admin.system/new-system (admin.system/new-config (or edn-file "prod.edn"))
                                                  (admin.system/ig-select-keys [:akvo.lumen.admin/remove-tenant]))
            administer (:akvo.lumen.admin/remove-tenant admin-system)]
        (exec administer label)
        (println "Ok")
        ))
    (println "Aborted")))

(defmethod ig/init-key :akvo.lumen.admin/remove-tenant [_ {:keys [authorizer] :as opts}]
  opts)
