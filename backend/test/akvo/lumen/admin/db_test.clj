(ns akvo.lumen.admin.db-test
  (:require [akvo.lumen.admin.db :as a.db]
            [clojure.test :refer [deftest is testing]]))

(deftest ^:unit coerce-jdbc-url-test
  (testing "coerce-jdbc-url"
    (is (= {:user "user1"
            :password "password"
            :database "db1"
            :host "localhost:5432"}
           (a.db/coerce-jdbc-url "jdbc:postgresql://localhost:5432/db1?user=user1&password=password")))
    (is (= {:user "lumen"
            :password "password"
            :ssl "true"
            :database "lumen"
            :host "postgres"}
           (a.db/coerce-jdbc-url "jdbc:postgresql://postgres/lumen?user=lumen&password=password&ssl=true")))))
