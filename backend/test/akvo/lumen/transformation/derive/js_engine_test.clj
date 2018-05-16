(ns akvo.lumen.transformation.derive.js-engine-test
  (:require [akvo.lumen.utils.logging-config :as logging-config :refer [with-no-logs]]
            [akvo.lumen.util :refer (time*)]
            [akvo.lumen.transformation.derive.js-engine :as js-engine]
            [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.test :refer :all]
            [clojure.tools.logging :as log]))

(defn row-prop [idx]
  (format "row['prop-%s']" idx))

(deftest timing-test
  (testing "simple js fn invocation "
    (let [js-engine (js-engine/js-engine)
          fun-name "test_fun"
          row-fun (time* :row-fun (#'js-engine/column-function fun-name "return row.prop"))]
      (->> row-fun (#'js-engine/eval* js-engine))
      (doseq [n (mapv first (next (take 20 (partition 1000 (range)))))]
       (time* (keyword (str "doseq-" n))
              (doseq [x (range n)]
                (assert (= x ((#'js-engine/invocation js-engine fun-name) {"prop" x})) x))))
      (is (int (rand-int 100)))))

  (testing "trying with big rows"
    (let [js-engine (js-engine/js-engine)
          fun-name "test_fun"
          idx (rand-int 100)
          message (apply str (conj (repeat 2000 "x") "-"))
          row (reduce #(assoc % (str "prop-" %2) (str %2 message)) {} (range 100))
          row-fun (time* :row-fun (#'js-engine/column-function fun-name (str "return row['prop-" idx "']")))]
      (->> row-fun (#'js-engine/eval* js-engine)) 
      (doseq [n (mapv first (next (take 20 (partition 1000 (range)))))]
        (time* (keyword (str "doseq-" n))
               (doseq [x (range n)]
                 (assert (=  (str idx message) ((#'js-engine/invocation js-engine fun-name) row))))))
      (is (int (rand-int 100)))))

  (testing "stressing js-process and big rows"
    (let [js-engine (js-engine/js-engine)
          fun-name "test_fun"
          props* 200
          idx (rand-int props*)
          idx2 (rand-int props*)
          code (format "function countX (s){return (s.match(/x/g) || []).length; } 
                return countX(%s)+countX(%s);" (row-prop idx) (row-prop idx2))
          row-fun (#'js-engine/column-function fun-name code)
          ]
      (#'js-engine/eval* js-engine row-fun) 
      (doseq [length* (mapv first (next (take 10 (partition 200 (range)))))]
        (let [message (apply str (conj (repeat length* "x") "-"))
              row (reduce #(assoc % (str "prop-" %2) (str %2 message)) {} (range props*))
              ntimes 500]
          (time* (keyword (str "message-length-" length* "-" ntimes))
                 (doseq [x (range ntimes)]
                   (assert (=  (double (* 2 length*)) ((#'js-engine/invocation js-engine fun-name) row)))))))
      (is (int (rand-int 100)))))
  
  )

 
