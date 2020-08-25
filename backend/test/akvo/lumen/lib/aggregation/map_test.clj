(ns akvo.lumen.lib.aggregation.map-test
  (:require [akvo.lumen.lib.aggregation.maps :as maps]
            [clojure.tools.logging :as log]
            [clojure.walk :as w]
            [clojure.test :refer :all]))

(deftest ^:unit add-filters-test
  (let [filter* {:datasetId "5e3303ab-9eb4-4216-b183-96998701d451"
                 :columns [{:value "Amsterdam", :column "c1", :strategy "is", :operation "keep", :columnType "text"}]}
        filters (w/stringify-keys (:columns filter*))
        viz {:id "5e33f643-544e-4e41-93dd-47712872e374",
             :datasetId "5e3303ab-9eb4-4216-b183-96998701d451",
             :name "yupie",
             :visualisationType "map",
             :spec
             {"layers"
              [{"popup" [],
                "longitude" nil,
                "pointSize" 3,
                "legend" {"title" "city", "visible" true},
                "filters" [],
                "latitude" nil,
                "visible" true,
                "aggregationMethod" "avg",
                "geom" "d4",
                "pointColorMapping" [],
                "pointColorColumn" "c1",
                "datasetId" "5e3303ab-9eb4-4216-b183-96998701d451",
                "title" "Untitled layer 1",
                "layerType" "geo-location",
                "rasterId" nil}
               {"popup" [],
                "longitude" nil,
                "pointSize" 3,
                "legend" {"title" "Gender", "visible" true},
                "filters" [],
                "latitude" nil,
                "visible" true,
                "aggregationMethod" "avg",
                "geom" "c76660916",
                "pointColorMapping" [],
                "pointColorColumn" "c75530916",
                "datasetId" "5e37ed1f-5f58-463b-b6af-ee89c3ace57b",
                "title" "Untitled layer 2",
                "layerType" "geo-location",
                "rasterId" nil}],
              "version" 1,
              "baseLayer" "street"},
             :created 1580463683887,
             :modified 1581089685620}]
    (is (=  (maps/add-filters viz filter*)
            {:id "5e33f643-544e-4e41-93dd-47712872e374",
             :datasetId "5e3303ab-9eb4-4216-b183-96998701d451",
             :name "yupie",
             :visualisationType "map",
             :spec
             {"layers"
              [{"popup" [],
                "longitude" nil,
                "pointSize" 3,
                "legend" {"title" "city", "visible" true},
                "filters" filters,
                "latitude" nil,
                "visible" true,
                "aggregationMethod" "avg",
                "geom" "d4",
                "pointColorMapping" [],
                "pointColorColumn" "c1",
                "datasetId" "5e3303ab-9eb4-4216-b183-96998701d451",
                "title" "Untitled layer 1",
                "layerType" "geo-location",
                "rasterId" nil}
               {"popup" [],
                "longitude" nil,
                "pointSize" 3,
                "legend" {"title" "Gender", "visible" true},
                "filters" [],
                "latitude" nil,
                "visible" true,
                "aggregationMethod" "avg",
                "geom" "c76660916",
                "pointColorMapping" [],
                "pointColorColumn" "c75530916",
                "datasetId" "5e37ed1f-5f58-463b-b6af-ee89c3ace57b",
                "title" "Untitled layer 2",
                "layerType" "geo-location",
                "rasterId" nil}],
              "version" 1,
              "baseLayer" "street"},
             :created 1580463683887,
             :modified 1581089685620}))))
