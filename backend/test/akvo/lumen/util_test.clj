(ns akvo.lumen.util-test
  (:require [akvo.lumen.util :as u]
            [clojure.test :refer [deftest is]]))

(deftest ^:unit split-with-non-stop
  (is (= [[1 2 2 0 0] [3 10]] (u/split-with-non-stop (partial > 3) [1 2 3 2 0 10 0] )))
  (is (= [[:c] [:a :b :d]] (u/split-with-non-stop (partial = :c) [:a :b :c :d]))))

(deftest ^:unit table-name-to-imported
  (let [uuid "69e34991_5f00_41ec_bf1c_11587fde55b1"]
   (is (= (str "imported_" uuid) (u/table-name-to-imported (str "ds_" uuid) )))))
