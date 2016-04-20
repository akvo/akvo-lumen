(ns org.akvo.dash.middleware-test
  (:require [org.akvo.dash.middleware :as m]
            [org.akvo.dash.system :as system]
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
  (when (= expected 200)
    (prn response))
  (is (= expected (:status response)))
  (condp = expected
    201 (is "" (:body response))
    200 (is "" (:body response))
    401 (is "Not authenticated" (:body response))
    403 (is "Not authorized" (:body response))))


(deftest wrap-auth-test

  (testing "GET / without claims"
    (let [response ((m/wrap-auth test-handler)
                    (immutant-request :get "/"))]
      (is (= 200 (:status response)))))

  (testing "POST / without claims"
    (let [response ((m/wrap-auth test-handler)
                    (immutant-request :post "/"))]
      (is (= 401 (:status response)))))

  (testing "GET resource with claims but no tenant"
    (check-response
     ((m/wrap-auth test-handler)
      (-> (immutant-request :get "/resource")
          (assoc-in [:jwt-claims "realm_access" "roles"]
                    ["akvo:dash:t0"])))
     403))

  (testing "GET resource with claims and tenant"
    (check-response
     ((m/wrap-auth test-handler)
      (-> (immutant-request :get "/resource")
          (assoc-in [:jwt-claims "realm_access" "roles"]
                    ["akvo:dash:t0"])
          (assoc :tenant "t0")))
     200))

  (testing "GET resource without claims"
    (let [response ((m/wrap-auth test-handler)
                    (immutant-request :get "/resource"))]
      (check-response response 401)))

  (testing "POST resource without claims"
    (let [response ((m/wrap-auth test-handler)
                    (immutant-request :post "/resource"))]
      (check-response response 401)))

  (testing "PATCH resource without claims"
    (let [response ((m/wrap-auth test-handler)
                    (immutant-request :patch "/resource"))]
      (check-response response 401)))

  (testing "HEAD resource without claims"
    (let [response ((m/wrap-auth test-handler)
                    (immutant-request :patch "/resource"))]
      (check-response response 401)))

  (testing "GET resource without claim role"
    (let [response ((m/wrap-auth test-handler)
                    (assoc-in (immutant-request :get "/resource")
                              [:jwt-claims "realm_access" "roles"]
                              []))]
      (check-response response 403)))

  (testing "POST resource without claim role"
    (let [response ((m/wrap-auth test-handler)
                    (assoc-in (immutant-request :post "/resource")
                              [:jwt-claims "realm_access" "roles"]
                              []))]
      (check-response response 403)))

  (testing "Faulty claims should return not authenticated"
    (let [response ((m/wrap-auth test-handler)
                    (assoc-in (immutant-request :get "/resource")
                              [:jwt-claims]
                              "realm_access"))]
      (check-response response 401))))


(deftest wrap-jwt-test
  (let [jwt-middleware (m/wrap-jwt test-handler
                                   (get-in system/base-config [:app :jwt]))]

    (testing "No token should not yeild jwt-claims."
      (let [response (jwt-middleware (immutant-request :get "/"))]
        (is (not (contains? response :jwt-claims)))))


    (testing "Invalid token should not yeild jwt-claims."
      (let [response (jwt-middleware (assoc-in (immutant-request :get "/")
                                               [:headers "authorization"]
                                               "invalid-token"
                                               ))]
        (is (not (contains? response :jwt-claims)))))))
