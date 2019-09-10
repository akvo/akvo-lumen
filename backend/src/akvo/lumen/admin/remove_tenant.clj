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
            [akvo.lumen.http.client :as http.client]
            [akvo.lumen.component.keycloak :as keycloak]
            [clojure.tools.logging :as log]
            [clojure.walk :as w]
            [clojure.string :as s]
            [cheshire.core :as json]))

(defn- search
  "Performs a linear search for an item in a collection for which (pred item) is truthy.
  Similar to `clojure.core/some` but returns the item instead of the predicate result."
  [pred xs]
  (some #(when (pred %) %) xs))

(defn- find-group
  "Find group by name in a sequence of groups"
  [groups group-name]
  (search #(= (:name %) group-name) groups))

(defn find-group-id
  "Find the keycloak group id for tenant-label, or nil if not found"
  [kc headers tenant-label]
  (let [all-groups (keycloak/get-groups kc headers util/http-client-req-defaults)
        akvo-group (find-group all-groups "akvo")
        lumen-group (find-group (:subGroups akvo-group) "lumen")
        tenant-group (find-group (:subGroups lumen-group) tenant-label)]
    (:id tenant-group)))

(defn- remove-re
  "Remove all strings in xs that matches re"
  [xs re]
  (vec (remove #(re-matches (re-pattern re) %) xs)))

(defn- remove-client-redirect-uris
  "Remove tenant label uri's from web origins and redirect uris"
  [client tenant-label]
  (let [re (format "https?://%s\\..+" tenant-label)]
    (-> client
        (update "webOrigins" remove-re re)
        (update "redirectUris" remove-re re))))

(defn cleanup-keycloak
  "Cleanup (remove) tenant-label from keycloak.
  - Remove redirect uri's associated with tenant-label
  - Remove the tenant-label's group"
  [kc tenant-label]
  (let [headers (keycloak/request-headers kc)
        confidential-client (-> (keycloak/fetch-client kc headers "akvo-lumen-confidential")
                              (remove-client-redirect-uris tenant-label))
        public-client (-> (keycloak/fetch-client kc headers "akvo-lumen")
                              (remove-client-redirect-uris tenant-label))
        group-id (find-group-id kc headers tenant-label)]

    (log/error :cleanup-keycloak :group-id group-id)
    (when (some? group-id)
      (log/info :update-public-client (:status (keycloak/update-client kc headers public-client util/http-client-req-defaults)))
      (log/info :update-confidential-client (:status (keycloak/update-client kc headers confidential-client util/http-client-req-defaults)))
      (log/info :remove-role-mappings (:status (keycloak/remove-role-mappings kc headers group-id util/http-client-req-defaults)))
      (log/info :remove-group (:status (keycloak/remove-group kc headers group-id util/http-client-req-defaults)))
      (log/info :remove-role (:status (keycloak/remove-role kc headers (util/role-name tenant-label) util/http-client-req-defaults)))
      (log/info :remove-admin-role (:status (keycloak/remove-role kc headers (util/role-name tenant-label true) util/http-client-req-defaults)))
      )))

(defn remove-tenant [label]
  (let [tenant (str "tenant_" (s/replace label "-" "_"))
        lumen-db-uri (util/db-uri {:database "lumen" :user "lumen"})
        kc (util/create-keycloak)]
    (log/error lumen-db-uri "DROP DATABASE %s" tenant)
    (util/exec-no-transact! lumen-db-uri "DROP DATABASE %s" tenant)
    (log/error lumen-db-uri "DROP ROLE %s" tenant)
    (util/exec-no-transact! lumen-db-uri "DROP ROLE %s" tenant)
    (log/error lumen-db-uri "DELETE FROM tenants WHERE label='%s'" label)
    (util/exec-no-transact! lumen-db-uri "DELETE FROM tenants WHERE label='%s'" label)
    (cleanup-keycloak kc label)))

(defn -main [label]
  (printf "Are you sure you want to remove tenant \"%s\" ('Yes' | 'No')? " label)
  (flush)
  (if (= (read-line) "Yes")
    (do (remove-tenant label)
        (println "Ok"))
    (println "Aborted")))
