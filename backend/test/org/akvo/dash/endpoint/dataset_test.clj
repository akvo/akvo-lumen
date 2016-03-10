(ns org.akvo.dash.endpoint.dataset-test
  (:require [clojure.test :refer :all]
            [clojure.pprint :refer [pprint]]
            [org.akvo.dash.endpoint.dataset :as dataset]
            [ring.mock.request :as mock]))

(def handler
  (dataset/endpoint {}))

(deftest handler-test
  (testing "logic"
    (is (= 1 1))))


;; (deftest handler-test
;;   (let [resp (handler (mock/request :get "/"))]
;;     (pprint resp)
;;     (is (= 1 1)))

;;   ;; (is (= (:status (handler (mock/request :get "/api/datasource")))
;;   ;;        (:status {:status  200
;;   ;;                  :headers {"content-type" "text/plain"}
;;   ;;                  :body    "Your expected result"})))

;;   )
