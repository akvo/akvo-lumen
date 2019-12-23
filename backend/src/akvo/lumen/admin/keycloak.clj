(ns akvo.lumen.admin.keycloak
  (:require [akvo.lumen.admin.util :as util]
            [clojure.tools.logging :as log]
            [slingshot.slingshot :as slingshot]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.lib.user :as lib.user]
            [clojure.string :as str]
            [clojure.set :as set]
            [environ.core :refer [env]]))


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
  (log/debug :tt tenant-label)
  (let [all-groups (keycloak/get-groups kc headers util/http-client-req-defaults)
        akvo-group (find-group all-groups "akvo")
        lumen-group (find-group (:subGroups akvo-group) "lumen")
        tenant-group (find-group (:subGroups lumen-group) tenant-label)]
    (log/debug :find-group-id :akvo-group akvo-group :lumen-group lumen-group :tenant-group tenant-group)
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

(defn remove-tenant
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




(defn user-representation
  [authorizer headers email]
  (if-let [user (keycloak/fetch-user-by-email headers (:api-root authorizer) email)]
    {:email email
     :user-id (get user "id")}
    (lib.user/create-new-account authorizer headers email)))

(defn- add-tenant-urls
  [client url]
  (-> client
      (update "webOrigins" conj url)
      (update "redirectUris" conj (format "%s/*" url))))

(defn add-tenant-urls-to-clients
  [authorizer headers url]
  (let [confidential-client (keycloak/fetch-client authorizer headers "akvo-lumen-confidential")
        public-client (keycloak/fetch-client authorizer headers "akvo-lumen")]
    (keycloak/update-client authorizer headers (add-tenant-urls confidential-client url) util/http-client-req-defaults)
    (keycloak/update-client authorizer headers (add-tenant-urls public-client url) util/http-client-req-defaults)))

(defn setup-tenant
  "Create two new groups as children to the akvo:lumen group"
  [authorizer label email url drop-if-exists?]
  (log/info :setup-tenant-in-keycloak label email url)
  (when drop-if-exists? (remove-tenant authorizer label))
  (slingshot/try+
    (let [headers (keycloak/request-headers authorizer)
          lumen-group-id (-> (keycloak/root-group authorizer headers)
                             (get "id"))
          tenant-id (keycloak/create-group authorizer headers lumen-group-id (util/role-name label) label)
          tenant-admin-id (keycloak/create-group authorizer headers tenant-id (util/role-name label true) "admin")
          {:keys [user-id email tmp-password] :as user-rep} (user-representation authorizer headers email)]
      (add-tenant-urls-to-clients authorizer headers url)
      (keycloak/add-user-to-group headers (:api-root authorizer) user-id tenant-admin-id)
      (log/info "User Credentials:" user-rep)
      (assoc user-rep :url url))
    (catch [:status 409] {:keys [body] :as o}
      (if (str/includes? body "already exists")
        (throw (ex-info "Keycloak data conflict problem, maybe you need to use :drop-if-exists? true "
                        {:body body
                         :status 409
                         :current-values {:drop-if-exists? drop-if-exists?}}))
        (slingshot/throw+)))))
