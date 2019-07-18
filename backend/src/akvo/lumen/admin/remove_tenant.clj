(ns akvo.lumen.admin.remove-tenant
  "The following env vars are assumed to be present:
  ENCRYPTION_KEY, KC_URL, KC_SECRET, PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD
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
            [cheshire.core :as json]))

(defn remove-group
  "Remove keycloak group by id"
  [kc id]
  (http.client/delete* (format "%s/groups/%s" (:api-root kc) id)
                 {:headers (keycloak/request-headers kc)
                  :as :json}))

(defn get-groups
  "List all keycloak groups and sub groups"
  [kc]
  (:body (http.client/get* (format "%s/groups" (:api-root kc))
                     {:headers (keycloak/request-headers kc)
                      :as :json})))

(defn get-clients
  "List all keycloak clients"
  [kc]
  (:body (http.client/get* (format "%s/clients" (:api-root kc))
                     {:headers (keycloak/request-headers kc)
                      :as :json})))

(defn update-client
  "Update keycloak client"
  [kc client]
  (http.client/put* (format "%s/clients/%s" (:api-root kc) (:id client))
              {:headers (keycloak/request-headers kc)
               :body (json/generate-string client)
               :content-type :json}))

(defn search
  "Performs a linear search for an item in a collection for which (pred item) is truthy.
  Similar to `clojure.core/some` but returns the item instead of the predicate result."
  [pred xs]
  (some #(when (pred %) %) xs))

(defn find-group
  "Find group by name in a sequence of groups"
  [groups group-name]
  (search #(= (:name %) group-name) groups))

(defn find-group-id
  "Find the keycloak group id for tenant-label, or nil if not found"
  [kc tenant-label]
  (let [all-groups (get-groups kc)
        akvo-group (find-group all-groups "akvo")
        lumen-group (find-group (:subGroups akvo-group) "lumen")
        tenant-group (find-group (:subGroups lumen-group) tenant-label)]
    (:id tenant-group)))

(defn find-client
  "Find a keycloak client by name"
  [clients client-name]
  (search #(= (:clientId %) client-name) clients))

(defn remove-re
  "Remove all strings in xs that matches re"
  [xs re]
  (vec (remove #(re-matches (re-pattern re) %) xs)))

(defn remove-client-redirect-uris
  "Remove tenant label uri's from web origins and redirect uris"
  [client tenant-label]
  (let [re (format "https?://%s\\..+" tenant-label)]
    (-> client
        (update :webOrigins remove-re re)
        (update :redirectUris remove-re re))))

(defn cleanup-keycloak
  "Cleanup (remove) tenant-label from keycloak.
  - Remove redirect uri's associated with tenant-label
  - Remove the tenant-label's group"
  [kc tenant-label]
  (let [client (-> (get-clients kc)
                   (find-client "akvo-lumen")
                   (remove-client-redirect-uris tenant-label))
        group-id (find-group-id kc tenant-label)]
    (update-client kc client)
    (remove-group kc group-id)))

(defn remove-tenant [label]
  (let [tenant (str "tenant_" label)
        lumen-db-uri (util/db-uri {:database "lumen"})
        kc (util/create-keycloak)]
    (util/exec! lumen-db-uri "DROP DATABASE %s" tenant)
    (util/exec! lumen-db-uri "DROP ROLE %s" tenant)
    (util/exec! lumen-db-uri "DELETE FROM tenants WHERE label='%s'" label)
    (cleanup-keycloak kc label)))

(defn -main [label]
  (printf "Are you sure you want to remove tenant \"%s\" ('Yes' | 'No')? " label)
  (flush)
  (if (= (read-line) "Yes")
    (do (remove-tenant label)
        (println "Ok"))
    (println "Aborted")))
