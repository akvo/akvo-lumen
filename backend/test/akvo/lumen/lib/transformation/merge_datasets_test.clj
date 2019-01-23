(ns akvo.lumen.lib.transformation.merge-datasets-test
  (:require [akvo.lumen.lib.transformation.merge-datasets :refer :all]
            [clojure.test :refer :all]))

(deftest distinct-columns-test
  (is (= '("c1" "c2" "c3" "identifier")
         (distinct-columns {:datasetId "uuid",
                            :mergeColumn "identifier",
                            :mergeColumns ["c1" "c2" "c3"],
                            :aggregationColumn nil,
                            :aggregationDirection "DESC"})))

  (is (= '("c1" "c2" "c3" "identifier" "c4")
         (distinct-columns {:datasetId "uuid",
                            :mergeColumn "identifier",
                            :mergeColumns ["c1" "c2" "c3"],
                            :aggregationColumn "c4",
                            :aggregationDirection "DESC"}))))
