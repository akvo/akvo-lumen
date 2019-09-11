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
  [handler {:keys [jwt-claims tenant] :as request} {:keys [authorizer]}]
  (try
    (let [email (get jwt-claims "email")
          allowed-paths (delay (p/allowed-paths authorizer email))]
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
      (let [wrap-info (fn [e v] (log/info (.getMessage e)) v)]
        (case (-> e ex-data :response-code)
          503 (wrap-info e u/service-unavailable)
          401 u/not-authorized
          (wrap-info e u/internal-server-error))))))

(defn wrap-api-authorization
  [authorizer]
  (fn [handler]
    (fn [request]
      (api-authorization handler request {:authorizer authorizer}))))
