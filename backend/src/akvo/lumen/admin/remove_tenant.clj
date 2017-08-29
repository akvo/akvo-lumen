(ns akvo.lumen.admin.remove-tenant
  (:require [akvo.lumen.admin.util :as util]
            [akvo.lumen.component.keycloak :as keycloak]
            [cheshire.core :as json]
            [clj-http.client :as client]))

;; The following env vars are assumed to be present:
;; PG_HOST,  PG_DATABASE, PG_USER, PG_PASSWORD, KC_URL, KC_SECRET
;; See add-tenant script for instructions on where to find these values
;;
;; $ lein run -m akvo.lumen.admin.remove-tenant <label>

(defn remove-group
  "Remove keycloak group by id"
  [kc id]
  (client/delete (format "%s/groups/%s" (:api-root kc) id)
                 {:headers (keycloak/request-headers kc)
                  :as :json}))

(defn get-groups
  "List all keycloak groups and sub groups"
  [kc]
  (:body (client/get (format "%s/groups" (:api-root kc))
                     {:headers (keycloak/request-headers kc)
                      :as :json})))

(defn get-clients
  "List all keycloak clients"
  [kc]
  (:body (client/get (format "%s/clients" (:api-root kc))
                     {:headers (keycloak/request-headers kc)
                      :as :json})))

(defn update-client
  "Update keycloak client"
  [kc client]
  (client/put (format "%s/clients/%s" (:api-root kc) (:id client))
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
