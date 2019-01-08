(ns akvo.lumen.lib.multiple-column-test
  (:require [akvo.lumen.lib.multiple-column :as multiple-column]
            [akvo.lumen.component.caddisfly-test :refer (caddisfly)]
            [clojure.test :refer :all]))

(deftest details-test
  (testing "get multiple column details"
    (let [multipleType "caddisfly"
          multipleId "0b4a0aaa-f556-4c11-a539-c4626582cca6"]
      (is (= 200 (:status (multiple-column/details {:caddisfly (caddisfly)} multipleType multipleId))))
      (is (= 404 (:status (multiple-column/details {} "other" multipleId))))
      (is (= 404 (:status (multiple-column/details {:caddisfly (caddisfly)} multipleType "not-found")))))))
