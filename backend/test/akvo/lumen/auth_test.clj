(ns akvo.lumen.auth-test
  (:require [akvo.lumen.auth :as m]
            [clojure.test :refer [deftest testing is]]
            [ring.mock.request :as mock]))

(defn- test-handler
  [request]
  {:status 200
   :headers {"content-type" "application/json"}
   :body ""})

(defn- immutant-request
  "Since Immutant is configured to run our application from a sub path /api
  we need to assoc path-info which contains our relative in-app path."
  [request-method uri]
  (assoc (mock/request request-method uri)
         :path-info uri))

(defn- check-response
  [response expected]
  (is (= expected (:status response)))
  (condp = expected
    201 (is (= "" (:body response)))
    200 (is (= "" (:body response)))
    401 (is (= "\"Not authenticated\"" (:body response)))
    403 (is (= "\"Not authorized\"" (:body response)))))

(def wrap-auth (m/wrap-auth {:issuer "keycloak"} {:issuer "auth0"}))

(deftest wrap-auth-test
  (testing "GET / without claims"
    (let [response ((wrap-auth test-handler)
                    (immutant-request :get "/"))]
      (is (= 401 (:status response)))))

  (testing "POST /api without claims"
    (let [response ((wrap-auth test-handler)
                    (immutant-request :post "/api"))]
      (is (= 401 (:status response)))))

  (testing "GET resource with claims but no tenant"
    (check-response
     ((wrap-auth test-handler)
      (-> (immutant-request :get "/api/resource")
          (assoc-in [:jwt-claims "realm_access" "roles"]
                    ["akvo:lumen:t0"])))
     403))

  (testing "GET resource with claims and tenant"
    (check-response
     ((wrap-auth test-handler)
      (-> (immutant-request :get "/api/resource")
          (assoc-in [:jwt-claims "realm_access" "roles"]
                    ["akvo:lumen:t0"])
          (assoc :tenant "t0")))
     200))

  (testing "GET resource as admin with claims and tenant"
    (check-response
     ((wrap-auth test-handler)
      (-> (immutant-request :get "/api/resource")
          (assoc-in [:jwt-claims "realm_access" "roles"]
                    ["akvo:lumen:t0"
                     "akvo:lumen:t0:admin"])
          (assoc :tenant "t0")))
     200))

  (testing "GET admin resource as admin with claims and tenant"
    (check-response
     ((wrap-auth test-handler)
      (-> (immutant-request :get "/api/admin/resource")
          (assoc-in [:jwt-claims "realm_access" "roles"]
                    ["akvo:lumen:t0"
                     "akvo:lumen:t0:admin"])
          (assoc :tenant "t0")))
     200))

  (testing "GET admin resource as non admin with claims and tenant"
    (check-response
     ((wrap-auth test-handler)
      (-> (immutant-request :get "/api/admin/resource")
          (assoc-in [:jwt-claims "realm_access" "roles"]
                    ["akvo:lumen:t0"])
          (assoc :tenant "t0")))
     403))

  (testing "GET resource without claims"
    (let [response ((wrap-auth test-handler)
                    (immutant-request :get "/api/resource"))]
      (check-response response 401)))

  (testing "POST resource without claims"
    (let [response ((wrap-auth test-handler)
                    (immutant-request :post "/api/resource"))]
      (check-response response 401)))

  (testing "PATCH resource without claims"
    (let [response ((wrap-auth test-handler)
                    (immutant-request :patch "/api/resource"))]
      (check-response response 401)))

  (testing "HEAD resource without claims"
    (let [response ((wrap-auth test-handler)
                    (immutant-request :patch "/api/resource"))]
      (check-response response 401)))

  (testing "GET resource without claim role"
    (let [response ((wrap-auth test-handler)
                    (assoc-in (immutant-request :get "/api/resource")
                              [:jwt-claims "realm_access" "roles"]
                              []))]
      (check-response response 403)))

  (testing "POST resource without claim role"
    (let [response ((wrap-auth test-handler)
                    (assoc-in (immutant-request :post "/api/resource")
                              [:jwt-claims "realm_access" "roles"]
                              []))]
      (check-response response 403)))

  (testing "Faulty claims should return not authenticated"
    (let [response ((wrap-auth test-handler)
                    (assoc-in (immutant-request :get "/api/resource")
                              [:jwt-claims]
                              "realm_access"))]
      (check-response response 403))))


(deftest api-tenant-admin?-test
  (let [tf (fn [cxt tenant allowed-paths bool]
             (testing cxt
               (is (= bool (m/api-tenant-admin? tenant allowed-paths)))))]

    (tf "Nil case"
        "demo" nil false)
    (tf "No allowed paths"
        "demo" #{} false)
    (tf "A user on the tenant"
        "demo" #{"demo" "t1"} false)
    (tf "A user on another tenant"
        "demo" #{"t1"} false)
    (tf "An admin on another tenant"
        "demo" #{"t1/admin"} false)
    (tf "An admin"
        "demo" #{"demo/admin"} true)))


(deftest api-tenant-member?-test
  (let [tf (fn [cxt tenant allowed-paths bool]
             (testing cxt
               (is (= bool (m/api-tenant-member? tenant allowed-paths)))))]

    (tf "Nil case"
        "demo" nil false)
    (tf "No allowed paths"
        "demo" #{} false)
    (tf "A user on the tenant"
        "demo" #{"demo" "t1"} true)
    (tf "A user on another tenant"
        "demo" #{"t1"} false)
    (tf "An admin on another tenant"
        "demo" #{"t1/admin"} false)
    (tf "An admin"
        "demo" #{"demo/admin"} true)))
