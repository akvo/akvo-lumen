(ns akvo.lumen.component.hikaricp-test
  (:require [clojure.test :refer :all]
            [akvo.lumen.component.hikaricp :as hikaricp]))

(deftest ssl-url-test
  (let [domain "http://domain.com/"
        expected-value (str domain "?arg1=3&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory")]
    (is (= expected-value 
           (hikaricp/ssl-url
            "http://domain.com/?arg1=3&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory")))
    (is (= expected-value
           (hikaricp/ssl-url
            "http://domain.com/?arg1=3")))
    (is (= "http://domain.com/?sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory"
           (hikaricp/ssl-url
            "http://domain.com/")))))


