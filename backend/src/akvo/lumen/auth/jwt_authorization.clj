(ns akvo.lumen.auth.jwt-authorization
  (:require
   [akvo.lumen.auth.utils :as u]))


(defn tenant-admin?
  [{:keys [tenant jwt-claims auth-roles]} issuer]
  (contains? auth-roles
             (format "akvo:lumen:%s:admin" tenant)))

(defn tenant-user?
  [{:keys [tenant jwt-claims auth-roles] :as data} issuer]
  (or (tenant-admin? data issuer)
      (contains? auth-roles
                 (format "akvo:lumen:%s" tenant))))

(defn wrap-jwt-authorization
  "Wrap authorization for the API via JWT claims as:
  - No claims -> Not authenticated.
  - Request to admin path -> needs admin role on current tenant.
  - Request to api path -> needs to be member role on current tenant.
  - Otherwise not authorized."
  [keycloak-public-client auth0-public-client]
  (fn [handler]
    (fn [{:keys [jwt-claims] :as request}]
      (if (u/api-authz? jwt-claims)
        (handler request)
        (let [issuer (u/issuer-type jwt-claims keycloak-public-client auth0-public-client)]
          (cond
            (nil? jwt-claims) u/not-authenticated
            (u/admin-path? request) (if (tenant-admin? request issuer)
                                      (handler request)
                                      u/not-authorized)
            (u/api-path? request) (if (tenant-user? request issuer)
                                    (handler request)
                                    u/not-authorized)
            :else u/not-authorized))))))
