(ns akvo.lumen.lib.aggregation.commons-test
  (:require [akvo.lumen.lib.aggregation.commons :as commons]
            [clojure.walk :as walk]
            [clojure.test :refer :all]))

(deftest spec-columns-test
  (let [filters [{"value" "3",
                  "column" "f1",
                  "strategy" "isHigher",
                  "operation" "keep",
                  "columnType" "number"}
                 {"value" nil,
                  "column" "f2",
                  "strategy" "isEmpty",
                  "operation" "remove",
                  "columnType" "text"}]
        data
        [{:id "5e8c447c-41e8-425e-b3f9-bb0c3afa0157",
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
          {"filters" filters,
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
           "categoryTitle" nil}}]]
    (testing "columns-spec by viz type defmethod"
      (is (= (mapv #(vector (:visualisationType %)
                            (vec (sort (commons/spec-columns (:visualisationType %) (walk/keywordize-keys (:spec %))))))
                   data)
             [["scatter" ["c1" "c2" "c3" "c4" "c5" "c6"]]
              ["bar" ["c1" "c2" "c3" "f1" "f2"]]
              ["bubble" ["c1" "c2"]]
              ["donut" ["c1"]]
              ["polararea" ["c1"]]
              ["area" ["c1" "c2"]]
              ["line" ["c1" "c2"]]
              ["pie" ["c1"]]
              ["pivot table" ["c1" "c2"]]])))))

