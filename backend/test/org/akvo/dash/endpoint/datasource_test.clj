(ns org.akvo.dash.endpoint.datasource-test
  (:require [clojure.test :refer :all]
            [clojure.pprint :refer [pprint]]
            [org.akvo.dash.endpoint.datasource :as datasource]
            [ring.mock.request :as mock]))

(def handler
  (datasource/endpoint {}))


(deftest collection-test

  (testing "Access"
    (let [resp (handler (mock/request :get "/datasources"))]
      (is (= 200
             (:status resp)))
      (is (= "application/json"
             (get-in resp [:headers "Content-Type"]))))))
