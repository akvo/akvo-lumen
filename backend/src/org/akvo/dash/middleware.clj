(ns org.akvo.dash.middleware
  ""
  (:require
   [clojure.string :as s]
   [akvo.commons.jwt :as jwt]
   [clj-http.client :as client]
   [ring.util.response :as response]))


(defn wrap-auth
  "First do not apply restrictions if on / and method is GET.
  If request not contains claims return 401. If tenant is not in claimed roles
  return 403. Otherwise grant access."
  [handler]
  (fn [request]
    (if (and (= "/" (:path-info request)) ;; GET @ root is public
             (= :get (:request-method request)))
      (handler request)
      (if-let [claimed-roles (get-in request [:jwt-claims "realm_access" "roles"])]
        (if (contains? (set claimed-roles)
                       (str "akvo:dash:" (:tenant request)))
          (handler request)
          (-> (response/response "Not authorized")
              (response/status 403)))
        (-> (response/response "Not authenticated")
            (response/status 401))))))


(defn wrap-jwt
  "Go get cert and feed it to wrap-jwt-claims. Needs error handling!"
  [handler issuer]
  (let [certs (-> (str issuer "/protocol/openid-connect/certs")
                  client/get
                  :body)]
    (jwt/wrap-jwt-claims handler (jwt/rsa-key certs 0) issuer)))
