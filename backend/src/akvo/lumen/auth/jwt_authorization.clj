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

(defn jwt-authorization
  [handler {:keys [jwt-claims] :as request}
   {:keys [keycloak-public-client auth0-public-client]}]
  (let [issuer (u/issuer-type jwt-claims keycloak-public-client auth0-public-client)]
    (cond
      (nil? jwt-claims) u/not-authenticated
      (u/admin-path? request) (if (tenant-admin? request issuer)
                                (handler request)
                                u/not-authorized)
      (u/api-path? request) (if (tenant-user? request issuer)
                              (handler request)
                              u/not-authorized)
      :else u/not-authorized)))

(defn wrap-jwt-authorization
  [keycloak-public-client auth0-public-client]
  (fn [handler]
    (fn [request]
      (jwt-authorization
       handler request {:auth0-public-client auth0-public-client
                        :keycloak-public-client keycloak-public-client}))))
