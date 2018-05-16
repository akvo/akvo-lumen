(ns akvo.lumen.transformation.derive.js-engine-test
  (:require [akvo.lumen.utils.logging-config :as logging-config :refer [with-no-logs]]
            [akvo.lumen.util :refer (time*)]
            [akvo.lumen.transformation.derive.js-engine :as js-engine]
            [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.test :refer :all]
            [clojure.tools.logging :as log]))

(deftest timing-test
  (testing "trying to isolate js-engine"
    (let [js-engine (js-engine/js-engine)
          fun-name "test_fun"
          row-fun (time* :row-fun (#'js-engine/column-function fun-name "row.prop"))]
      (doseq [n (mapv first (next (take 2 (partition 1000 (range)))))]
       (time* (keyword (str "doseq-" n))
              (doseq [x (range n)]
                (->> row-fun
                     (#'js-engine/eval* js-engine))
                (is (= x ((#'js-engine/invocation js-engine fun-name) {"prop" x})))))))
    #_(is (js-engine/evaluable? "jor"))
    ))

