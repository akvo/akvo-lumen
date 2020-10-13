(ns akvo.lumen.lib.aggregation.commons-test
  (:require [akvo.lumen.lib.aggregation.commons :as commons]
            [akvo.lumen.specs.visualisation :as s.visualisation]
            [akvo.lumen.specs]
            [clojure.walk :as walk]
            [clojure.test :refer :all]))

(defn popup [prefix] (mapv #(hash-map "column" (str prefix (inc %))) (range 2)) )

(defn filters [prefix]
  (mapv #(let [d {"value" nil,
                  "strategy" "isEmpty",
                  "operation" "remove",
                  "columnType" "text"}]
           (assoc d  "column" (str prefix (inc %)))) (range 2)))

(def map-spec
  {"layers"
   [
    {
     ;; geo location layer
     "layerType" "geo-location",
     "popup" (popup "p"),
     "longitude" nil,
     "pointSize" 3,
     "legend" {"title" "Family size", "visible" true},
     "filters" (filters "f"),
     "latitude" nil,
     "visible" true,
     "aggregationMethod" "avg",
     "geom" "c1",
     "pointColorMapping" [],
     "pointColorColumn" "c2",
     "datasetId" "5e8b13fe-2c7d-4478-b340-f8e0aba9ec2a",
     "title" "Untitled layer 1",
     "rasterId" nil}
    {
     ;; geo shape layer
     "layerType" "geo-shape",
     "popup" (popup "pp")
     "longitude" nil,
     "pointSize" 3,
     "legend" {"title" nil, "visible" true},
     "aggregationDataset" "5e8b13fe-2c7d-4478-b340-f8e0aba9ec2",
     "filters" (filters "ff"),
     "latitude" nil,
     "visible" true,
     "aggregationMethod" "avg",
     "geom" "c3",
     "pointColorMapping" [],
     "pointColorColumn" nil, ;; is ok that is nil .. client is sending the nil value
     "datasetId" "5e8b13fe-2c7d-4478-b340-f8e0aba9ec2a",
     "title" "Untitled layer 1",
     "aggregationGeomColumn" "c4",
     "rasterId" nil,
     "aggregationColumn" "c5"}
    ],
   "version" 1,
   "baseLayer" "street"
   "centreOfTheWorld" "greenwich"
   })

(deftest ^:unit spec-columns-test
  (let [data
        [{:id "5e8c4554-e6ed-4c75-95b1-3d7d4eaea231",
          :visualisationType "map",
          :spec map-spec}
         {:id "5e8c447c-41e8-425e-b3f9-bb0c3afa0157",
          :visualisationType "scatter",
          :spec
          {"bucketColumnCategory" "c1",
           "categoryLabel" "Education",
           "datapointLabelColumn" "c2",
           "sizeLabel" "Family size",
           "filters" [],
           "categoryLabelFromUser" nil,
           "sizeLabelFromUser" false,
           "metricAggregation" "mean",
           "metricColumnSize" "c3",
           "axisLabelXFromUser" false,
           "axisLabelY" "Age - mean",
           "version" 1,
           "metricColumnX" "c4",
           "bucketColumn" "c5",
           "metricColumnY" "c6",
           "showLegend" true,
           "legendPosition" "right",
           "axisLabelX" "Family size - mean",
           "axisLabelYFromUser" false}}
         {:id "5e8b1430-e712-48db-8e42-2f713e3901b2",
          :visualisationType "bar",
          :spec
          {"filters" (filters "f")
           "sort" nil,
           "subBucketColumn" "c1",
           "showLabels" false,
           "metricAggregation" "count",
           "axisLabelXFromUser" false,
           "legendTitle" "Education",
           "axisLabelY" "Age - count",
           "metricColumnsY" [],
           "horizontal" false,
           "version" 2,
           "metricColumnX" nil,
           "bucketColumn" "c2",
           "metricColumnY" "c3",
           "showValueLabels" false,
           "legendPosition" "top",
           "subBucketMethod" "split",
           "axisLabelX" "Country",
           "truncateSize" nil,
           "axisLabelYFromUser" false}}
         {:id "5e8c43a4-0061-459f-9833-3c97f5b6d672",
          :visualisationType "bubble",
          :spec
          {"metricLabelFromUser" false,
           "bucketLabel" "Country",
           "filters" [],
           "showLabels" false,
           "metricAggregation" "mean",
           "legendTitle" "Country",
           "version" 1,
           "bucketColumn" "c1",
           "showLegend" true,
           "metricLabel" "Age - mean",
           "legendPosition" "right",
           "metricColumn" "c2",
           "truncateSize" nil}}
         {:id "5e8c41c4-3e52-49a2-94b9-0329823cbb64",
          :visualisationType "donut",
          :spec
          {"sort" nil,
           "filters" [],
           "version" 1,
           "showLegend" nil,
           "legendTitle" "Family size",
           "bucketColumn" "c1"}}
         {:id "5e8c4412-9804-41c4-b24e-decfcbc586d2",
          :visualisationType "polararea",
          :spec
          {"sort" nil,
           "filters" [],
           "version" 1,
           "showLegend" nil,
           "legendTitle" "Gender",
           "bucketColumn" "c1"}}
         {:id "5e8c429a-92bf-40f9-829f-f8fc428499f8",
          :visualisationType "area",
          :spec
          {"filters" [],
           "metricAggregation" nil,
           "axisLabelXFromUser" false,
           "axisLabelY" "Name",
           "version" 1,
           "metricColumnX" "c1",
           "metricColumnY" "c2",
           "axisLabelX" "Family size",
           "axisLabelYFromUser" false}}
         {:id "5e8c43c2-3cd2-42af-8471-64ed6ee8d10c",
          :visualisationType "line",
          :spec
          {"filters" [],
           "metricAggregation" nil,
           "axisLabelXFromUser" false,
           "axisLabelY" "Education",
           "version" 1,
           "metricColumnX" "c1",
           "metricColumnY" "c2",
           "axisLabelX" "Age",
           "axisLabelYFromUser" false}}
         {:id "5e8c43f4-b88f-4e0c-b901-eea0360a10ac",
          :visualisationType "pie",
          :spec
          {"sort" nil,
           "filters" [],
           "version" 1,
           "showLegend" nil,
           "legendTitle" "Family size",
           "bucketColumn" "c1"}}
         {:id "5e8c444a-6036-45ae-a283-0711b6255f4f",
          :visualisationType "pivot table",
          :spec
          {"hideColumnTotals" false,
           "rowColumn" "c1",
           "decimalPlaces" 3,
           "hideRowTotals" false,
           "filters" [],
           "rowTitle" nil,
           "aggregation" "count",
           "valueColumn" nil,
           "version" 1,
           "valueDisplay" "default",
           "categoryColumn" "c2",
           "categoryTitle" nil}}]
        data (map (partial merge {:datasetId "5e8b13fe-2c7d-4478-b340-f8e0aba9ec2a"
                                  :name "name"
                                  :created 1586172976186
                                  :modified 1586250225831}) data)
        expectations [["map" ["c1" "c2" "c3" "c4" "c5" "f1" "f2" "ff1" "ff2" "p1" "p2" "pp1" "pp2"]]
                      ["scatter" ["c1" "c2" "c3" "c4" "c5" "c6"]]
                      ["bar" ["c1" "c2" "c3" "f1" "f2"]]
                      ["bubble" ["c1" "c2"]]
                      ["donut" ["c1"]]
                      ["polararea" ["c1"]]
                      ["area" ["c1" "c2"]]
                      ["line" ["c1" "c2"]]
                      ["pie" ["c1"]]
                      ["pivot table" ["c1" "c2"]]]]
    (testing "columns* by clojure.spec"
      (is (= (mapv #(vector (:visualisationType %)
                            (vec (sort (vec (commons/spec-columns ::s.visualisation/visualisation (walk/keywordize-keys %))))))
                   data)
             expectations)))))

(def test-data-groups [{:columns [{:columnName "instance_id"}
                                  {:columnName "rnum"}
                                  {:columnName "identifier"}
                                  {:columnName "A"}]
                        :groupId "metadata"
                        :table-name "ds_meta"}
                       {:columns [{:columnName "instance_id"}
                                  {:columnName "rnum"}
                                  {:columnName "B"}]
                        :groupId "repeated"
                        :table-name "ds_repeated"}
                       {:groupId "not-repeated"
                        :columns [{:columnName "instance_id"}
                                  {:columnName "rnum"}
                                  {:columnName "C"}]
                        :table-name "ds_not_repeated"}])


(def test-data-groups-template {:select ["instance_id" "rnum" "identifier" "A" "B" "C"]
                                :from ["ds_meta" "ds_repeated" "ds_not_repeated"]})

(deftest ^:unit generate-data-groups-template-sql
  (is (= test-data-groups-template (commons/data-groups-sql-template test-data-groups))))

(deftest ^:unit generate-data-groups-sql
  (let [expected "SELECT instance_id, rnum, identifier, A, B, C FROM ds_meta, ds_repeated, ds_not_repeated WHERE ds_meta.instance_id=ds_repeated.instance_id AND ds_meta.instance_id=ds_not_repeated.instance_id"]
    (is (= expected (commons/data-groups-sql test-data-groups-template)))))

(deftest ^:unit data-groups-view
  (let [expected "CREATE TEMP VIEW foo AS SELECT * FROM bar"]
    (is (= expected (commons/data-groups-temp-view "foo" "SELECT * FROM bar")))))
