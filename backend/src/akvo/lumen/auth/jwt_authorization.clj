(ns akvo.lumen.auth.jwt-authorization
  (:require
   [akvo.lumen.component.keycloak :as keycloak]
   [akvo.lumen.auth.utils :as u]))


(defn- tenant-admin?
  [tenant auth-roles]
  (contains? auth-roles
             (format "akvo:lumen:%s:admin" tenant)))

(defn- tenant-user?
  [tenant auth-roles]
  (or (tenant-admin? tenant auth-roles)
      (contains? auth-roles
                 (format "akvo:lumen:%s" tenant))))

(defn ^:deprecated jwt-authorization
  "
  Only used with keycloak jwt!!

  should be removed once we test the performance of authorizer service and fully move to auth0
  "
  [handler {:keys [jwt-claims tenant] :as request}
   {:keys [keycloak-public-client auth0-public-client]}]
  (let [issuer (u/issuer-type jwt-claims keycloak-public-client auth0-public-client)
        auth-roles (keycloak/claimed-roles jwt-claims)]
    (cond
      (nil? jwt-claims) u/not-authenticated
      (u/admin-path? request) (if (tenant-admin? tenant auth-roles)
                                (handler request)
                                u/not-authorized)
      (u/api-path? request) (if (tenant-user? tenant auth-roles)
                              (handler request)
                              u/not-authorized)
      :else u/not-authorized)))
