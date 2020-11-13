(ns akvo.lumen.lib.visualisation.maps-test
  (:require [akvo.lumen.lib.visualisation.maps :as m]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.util :as util]
            [akvo.lumen.lib.visualisation.map-config :as map-config]
            [clojure.test :refer :all]))

(deftest ^:unit hue-color
  (is (= "0" (map-config/color-to-hue "#FF0000" )))
  (is (= "120" (map-config/color-to-hue "#00FF00")))
  (is (= "240" (map-config/color-to-hue "#0000FF")))
  (is (= "282" (map-config/color-to-hue "#7b1fa2"))))

(deftest ^:unit invalid-location-spec?

  (let [p util/valid-column-name?]

    (testing "Sanity check for invalid location specs"
      (is (not (m/valid-location? nil p)))
      (is (not (m/valid-location? {} p))))

    (testing "Only geom column"
      (is (m/valid-location? {:geom "c1"} p))
      (is (not (m/valid-location? {:geom nil} p)))
      (is (not (m/valid-location? {:geom 1} p))))

    (testing "Only latitude & longitude columns"
      (is (m/valid-location? {:latitude "c1"
                              :longitude "c2"} p))
      (is (not (m/valid-location? {:latitude "c1"} p)))
      (is (not (m/valid-location? {:latitude "c1"
                                   :longitude "c1"} p)))
      (is (not (m/valid-location? {:latitude nil
                                   :longitude "c1"} p)))
      (is (not (m/valid-location? {:latitude "c1"
                                   :longitude 2} p))))

    (testing "Both geom & lat/long"
      (is (not (m/valid-location? {:geom nil
                                   :latitude nil
                                   :longitude nil} p)))
      (is (m/valid-location? {:geom "c1"
                              :latitude nil
                              :longitude nil} p))
      (is (m/valid-location? {:geom nil
                              :latitude "c2"
                              :longitude "c3"} p))

      (is (not (m/valid-location? {:geom "c1"
                                   :latitude "c1"
                                   :longitude "c2"} p)))

      (is (m/valid-location? {:geom "c1"
                              :latitude "c2"
                              :longitude nil} p))

      (is (m/valid-location? {:geom "c1"
                              :longitude "c2"} p)))




    #_(testing "Both geom, lat & long"
        (is (m/valid-location? {"geom" nil
                                "latitude" "c1"
                                "longitude" "c2"} p))
        (is (not (m/valid-location? {"geom" nil
                                     "latitude" nil
                                     "longitude" "c2"} p)))
        (is (m/valid-location? {"geom" "c1"
                                "latitude" nil
                                "longitude" nil} p))
        (is (m/valid-location? {"geom" nil
                                "latitude" "c1"
                                "longitude" "c2"} p))
        )

    #_(testing "Valid location specs"
        (is (m/valid-location? {"geom" "c1"} p))
        (is (m/valid-location? {"latitude" "c1"
                                "longitude" "c2"} p))
        (is (m/valid-location? {"geom" nil
                                "latitude" "c1"
                                "longitude" "c2"} p)))))
