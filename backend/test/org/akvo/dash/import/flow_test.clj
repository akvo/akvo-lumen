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
           nil))))

