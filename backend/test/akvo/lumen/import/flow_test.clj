(ns akvo.lumen.import.flow-test
  (:require [akvo.lumen.import.flow :refer :all]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.test :refer :all]))

(comment
  (require 'clojure.tools.namespace.repl)
  (clojure.tools.namespace.repl/refresh))

(deftest response-rendering
  (testing "FREE_TEXT responses"
    (is (= (render-response {:value "foo" :question-type "FREE_TEXT"})
           "foo"))
    (is (= (render-response {:value nil :question-type "FREE_TEXT"})
           nil))
    (is (= (render-response {:value 42 :question-type "FREE_TEXT"})
           nil))
    (is (= (render-response {:value {:foo "bar"} :question-type "FREE_TEXT"})
           nil)))

  (testing "NUMBER responses"
    (is (= (render-response {:value 42 :question-type "NUMBER"})
           42))
    (is (= (render-response {:value 3.14 :question-type "NUMBER"})
           3.14))
    (is (= (render-response {:value "not-a-number" :question-type "NUMBER"})
           nil)))

  (testing "CASCADE responses"
    (is (= (render-response {:value [{"name" "France"} {"name" "Paris"}] :question-type "CASCADE"})
           "France|Paris"))))

(deftest root-ids-test
  (testing "Parse root ids from claims set"
    (is (= (set (root-ids "akvoflow-1" {"realm_access" {"roles" []}}))
           #{}))
    (is (= (set (root-ids "akvoflow-1" {"realm_access" {"roles" ["akvo:lumen:tenant-1"]}}))
           #{}))
    (is (= (set (root-ids "akvoflow-1" {"realm_access" {"roles" ["akvo:lumen:tenant-1"
                                                                 "akvo:flow:akvoflow-2:0"]}}))
           #{}))
    (is (= (set (root-ids "akvoflow-1" {"realm_access" {"roles" ["akvo:lumen:tenant-1"
                                                                 "akvo:flow:akvoflow-2:0"
                                                                 "akvo:flow:akvoflow-1:0"]}}))
           #{0}))
    (is (= (set (root-ids "akvoflow-1" {"realm_access" {"roles" ["akvo:lumen:tenant-1"
                                                                 "akvo:flow:akvoflow-2:0"
                                                                 "akvo:flow:akvoflow-1:0"
                                                                 "akvo:flow:akvoflow-1:123"]}}))
           #{0 123}))))

(deftest dataset-columns-test
  (testing "Dataset columns from form definitions"
    (is (= (dataset-columns (edn/read-string (slurp (io/resource "form-definition.edn"))))
           [{:title "Identifier", :type "text", :column-name "c1"}
            {:title "Latitude", :type "number", :column-name "c2"}
            {:title "Longitude", :type "number", :column-name "c3"}
            {:title "Submitter", :type "text", :column-name "c4"}
            {:title "Submitted at", :type "date", :column-name "c5"}
            {:type "text", :title "Geoshape", :column-name "c6"}
            {:type "text", :title "Barcode", :column-name "c7"}
            {:type "date", :title "Date", :column-name "c8"}
            {:type "text", :title "Video", :column-name "c9"}
            {:type "text", :title "Photo", :column-name "c10"}
            {:type "text", :title "Geolocation", :column-name "c11"}
            {:type "number", :title "Number", :column-name "c12"}
            {:type "text", :title "Cascade", :column-name "c13"}
            {:type "text", :title "Option", :column-name "c14"}
            {:type "text", :title "Free Text", :column-name "c15"}]))))
