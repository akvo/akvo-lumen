(ns org.akvo.dash.import.flow-test
  (:require [clojure.test :refer :all]
            [org.akvo.dash.import.flow :refer :all]))

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

  (testing "CASCADE responses"
    (is (= (render-response {:value [{"name" "France"} {"name" "Paris"}] :question-type "CASCADE"})
           "France|Paris"))))

(deftest root-ids-test
  (testing "Parse root ids from claims set"
    (is (= (set (root-ids "akvoflow-1" {"realm_access" {"roles" []}}))
           #{}))
    (is (= (set (root-ids "akvoflow-1" {"realm_access" {"roles" ["akvo:dash:tenant-1"]}}))
           #{}))
    (is (= (set (root-ids "akvoflow-1" {"realm_access" {"roles" ["akvo:dash:tenant-1"
                                                                 "akvo:flow:akvoflow-2:0"]}}))
           #{}))
    (is (= (set (root-ids "akvoflow-1" {"realm_access" {"roles" ["akvo:dash:tenant-1"
                                                                 "akvo:flow:akvoflow-2:0"
                                                                 "akvo:flow:akvoflow-1:0"]}}))
           #{0}))
    (is (= (set (root-ids "akvoflow-1" {"realm_access" {"roles" ["akvo:dash:tenant-1"
                                                                 "akvo:flow:akvoflow-2:0"
                                                                 "akvo:flow:akvoflow-1:0"
                                                                 "akvo:flow:akvoflow-1:123"]}}))
           #{0 123}))))
