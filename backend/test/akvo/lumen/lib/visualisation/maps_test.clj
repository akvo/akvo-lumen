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

(def ^:private shape-cols
  [{:columnName "name"} {:columnName "c1"} {:columnName "geom"}])

(def ^:private agg-cols
  [{:columnName "population"} {:columnName "boundary"}])

(def ^:private bogus-column
  "name,(select v from other_table) as extra")

(deftest ^:unit validate-layer-columns
  (testing "valid popup + label columns return the layer unchanged"
    (let [layer {:layerType "geo-location"
                 :popup [{:column "name"} {:column "c1"}]
                 :shapeLabelColumn "name"}]
      (is (= layer (m/validate-layer-columns layer shape-cols nil)))))

  (testing "unknown popup column is rejected"
    (is (thrown-with-msg?
         clojure.lang.ExceptionInfo #"No such column"
         (m/validate-layer-columns
          {:layerType "geo-location" :popup [{:column bogus-column}]}
          shape-cols nil))))

  (testing "unknown shapeLabelColumn is rejected"
    (is (thrown-with-msg?
         clojure.lang.ExceptionInfo #"No such column"
         (m/validate-layer-columns
          {:layerType "geo-shape" :popup [] :shapeLabelColumn bogus-column}
          shape-cols nil))))

  (testing "aggregation columns are validated against the aggregation dataset, not the shape dataset"
    (let [layer {:layerType "geo-shape" :popup []
                 :aggregationDataset "agg-id"
                 :aggregationColumn "population"
                 :aggregationGeomColumn "boundary"
                 :aggregationMethod "avg"}]
      ;; "population" exists in agg-cols -> accepted
      (is (= layer (m/validate-layer-columns layer shape-cols agg-cols)))
      ;; a shape-dataset column name is NOT valid for the aggregation field
      (is (thrown-with-msg?
           clojure.lang.ExceptionInfo #"No such column"
           (m/validate-layer-columns
            (assoc layer :aggregationColumn "name") shape-cols agg-cols)))))

  (testing "unknown aggregationColumn / aggregationGeomColumn are rejected"
    (let [base {:layerType "geo-shape" :popup []
                :aggregationDataset "agg-id"
                :aggregationColumn "population"
                :aggregationGeomColumn "boundary"
                :aggregationMethod "avg"}]
      (is (thrown-with-msg?
           clojure.lang.ExceptionInfo #"No such column"
           (m/validate-layer-columns (assoc base :aggregationColumn bogus-column)
                                     shape-cols agg-cols)))
      (is (thrown-with-msg?
           clojure.lang.ExceptionInfo #"No such column"
           (m/validate-layer-columns (assoc base :aggregationGeomColumn bogus-column)
                                     shape-cols agg-cols)))))

  (testing "aggregationMethod: present-and-invalid rejected, valid accepted, absent defaults ok"
    (let [base {:layerType "geo-shape" :popup []
                :aggregationDataset "agg-id"
                :aggregationColumn "population"
                :aggregationGeomColumn "boundary"}]
      (is (thrown-with-msg?
           clojure.lang.ExceptionInfo #"aggregationMethod"
           (m/validate-layer-columns (assoc base :aggregationMethod "sum);drop table t;--")
                                     shape-cols agg-cols)))
      (is (some? (m/validate-layer-columns (assoc base :aggregationMethod "sum")
                                           shape-cols agg-cols)))
      ;; absent aggregationMethod -> defaults to "avg" downstream, must be accepted
      (is (some? (m/validate-layer-columns base shape-cols agg-cols)))))

  (testing "raster layers are skipped entirely"
    (let [layer {:layerType "raster" :popup [{:column bogus-column}]}]
      (is (= layer (m/validate-layer-columns layer nil nil))))))
