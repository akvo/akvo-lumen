(ns akvo.lumen.endpoint.invite-test
  (:require [akvo.lumen.endpoint.invite :as invite]
            [clojure.test :refer :all]))

(deftest ^:unit location
  (testing "Production"
    (is (= "https://example.akvolumen.org"
           (invite/location nil {:server-name "example.akvolumen.org"}))))

  (testing "Development"
    (is (= "http://t1.lumen.localhost:3030"
           (invite/location {:client-port 3030
                             :scheme :http}
                            {:server-name "t1.lumen.localhost"})))))
