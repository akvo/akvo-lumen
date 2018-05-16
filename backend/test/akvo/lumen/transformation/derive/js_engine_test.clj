(ns akvo.lumen.transformation.derive.js-engine-test
  (:require [akvo.lumen.utils.logging-config :as logging-config :refer [with-no-logs]]
            [akvo.lumen.util :refer (time*)]
            [akvo.lumen.transformation.derive.js-engine :as js-engine]
            [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.test :refer :all]
            [clojure.tools.logging :as log]))

(deftest timing-test
  (testing "simple js fn invocation "
    (let [js-engine (js-engine/js-engine)
          fun-name "test_fun"
          
          row-fun (time* :row-fun (#'js-engine/column-function fun-name "row.prop"))]
      (->> row-fun (#'js-engine/eval* js-engine))
      (doseq [n (mapv first (next (take 20 (partition 1000 (range)))))]
       (time* (keyword (str "doseq-" n))
              (doseq [x (range n)]
                (assert (= x ((#'js-engine/invocation js-engine fun-name) {"prop" x})) x)))))))

