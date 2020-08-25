(ns akvo.lumen.lib.import.flow-common-test
  (:require [akvo.lumen.lib.import.flow-common :as flow-common]
            [clojure.test :refer :all]))

(deftest ^:unit form-submission-nulls-values
  (testing "flow only send values for questions that are filled"
    (let [groups [{:id "1G"
                   :repeatable true}
                  {:id "2G"
                   :repeatable false}]]
      (let [responses {"1G" [{"1G1Q" "A"
                              "1G2Q" [{"text" "yes", "code" "1"}]
                              "1G3Q" 36.0}
                             {"1G1Q" "Pol"
                              "1G2Q" [{"text" "no", "code" "2"}]
                              "1G3Q" 12.0}]
                       "2G" [{"1" "A"
                              "2" "B"}]}]
        (is (= [{"1" "A"
                 "2" "B"}
                {"1G1Q" "A"
                 "1G2Q" [{"text" "yes", "code" "1"}]
                 "1G3Q" 36.0}]
               (flow-common/question-responses groups responses))))
      (let [responses {"1G" [{"1G2Q" [{"text" "yes" "code" "1"}]
                              "1G3Q" 36.0}
                             {"1G1Q" "Pol"
                              "1G3Q" 12.0}]
                       "2G" [{"2G1Q" "A"
                              "2G2Q" "B"}]}]
        (is (= [{"2G1Q" "A"
                 "2G2Q" "B"}
                {"1G2Q" [{"text" "yes", "code" "1"}]
                 "1G3Q" 36.0}]
               (flow-common/question-responses groups responses))))
      (let [responses {"1G" [{}
                             {}]
                       "2G" [{"2G2Q" "B"}]}]
        (is (= [{"2G2Q" "B"}
                {}]
               (flow-common/question-responses groups responses)))))))
