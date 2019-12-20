(ns akvo.lumen.auth.api-authorization
  (:require
   [akvo.lumen.auth.utils :as u]
   [akvo.lumen.protocols :as p]
   [clojure.tools.logging :as log]))


(defn api-tenant-admin?
  [tenant allowed-paths]
  (contains? allowed-paths (str tenant "/admin")))

(defn api-tenant-member?
  [tenant allowed-paths]
  (or
   (api-tenant-admin? tenant allowed-paths)
   (contains? allowed-paths tenant)))


(defn api-authorization
  [handler {:keys [jwt-claims tenant] :as request} {:keys [error-tracker] :as authorizer}]
  (try
    (let [allowed-paths (delay (p/allowed-paths authorizer {:email (get jwt-claims "email")
                                                            :iat   (get jwt-claims "iat")}))]
      (cond
        (nil? jwt-claims) u/not-authorized
        (u/admin-path? request) (if (api-tenant-admin? tenant @allowed-paths)
                                  (handler request)
                                  u/not-authorized)
        (u/api-path? request) (if (api-tenant-member? tenant @allowed-paths)
                                (handler request)
                                u/not-authorized)
        :else u/not-authorized))
    (catch Exception e
      (let [wrap-error (fn [ex v]
                        (log/error ex)
                        (p/track error-tracker ex))]
        (case (-> e ex-data :response-code)
          503 (wrap-error e u/service-unavailable)
          401 u/not-authorized
          (wrap-error e u/internal-server-error))))))

(defn wrap-api-authorization
  [deps]
  (fn [handler]
    (fn [request]
      (api-authorization handler request {:authorizer deps}))))
