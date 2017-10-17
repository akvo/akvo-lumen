(ns akvo.lumen.lib.visualisation.maps-test
  (:require [akvo.lumen.lib.visualisation.maps :as m]
            [clojure.test :refer :all]))

(deftest invalid-location-spec?

  (let [p string?]

    (testing "Invalid location specs"
      (is (not (m/valid-location? nil p)))
      (is (not (m/valid-location? {} p)))
      (is (not (m/valid-location? {"latitude" nil} p)))
      (is (not (m/valid-location? {"latitude" 1} p)))
      (is (not (m/valid-location? {"latitude" "c1"} p)))
      (is (not (m/valid-location? {"latitude" "c1"
                                   "longitude" nil} p)))
      (is (not (m/valid-location? {"latitude" "c1"
                                   "geom" nil} p)))
      (is (not (m/valid-location? {"latitude" "c1"
                                   "geom" "c2"} p)))
      (is (not (m/valid-location? {"latitude" "c1"
                                   "longtitude" 1} p)))
      (is (not (m/valid-location? {"geom" 1} p))))

    (testing "Valid location specs"
      (is (m/valid-location? {"geom" "c1"} p))
      (is (m/valid-location? {"latitude" "c1"
                              "longitude" "c2"} p)))))
