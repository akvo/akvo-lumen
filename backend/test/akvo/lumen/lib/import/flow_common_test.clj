(ns akvo.lumen.lib.import.flow-common-test
  (:require [akvo.lumen.lib.import.flow-common :as flow-common]
            [akvo.lumen.lib.import.common :as common]
            [clojure.test :refer :all]))

(def rqg-id "567919211")

(def rqg-name "My Repeatead Group")

(def rqs [{:id "587209169",
           :name "Name",
           :type "FREE_TEXT",
           :order 1,
           :variableName "_name_repeated",
           :createdAt "2019-12-05T17:27:31.751Z",
           :modifiedAt "2020-03-09T11:01:26.390Z"}
          {:id "565649136",
           :name "Age repeated",
           :type "NUMBER",
           :order 2,
           :variableName "_age_repeated",
           :createdAt "2019-12-05T17:28:00.253Z",
           :modifiedAt "2019-12-05T17:28:32.347Z"}
          {:id "569709126",
           :name "ID number",
           :type "NUMBER",
           :order 3,
           :variableName "id_number",
           :createdAt "2019-12-05T17:28:46.962Z",
           :modifiedAt "2019-12-05T17:29:08.434Z"}])

(def form {:id "569469117",
           :name "Registration Form",
           :questionGroups
           [{:id "559609117",
             :name "Sample Questions",
             :repeatable false,
             :questions
             [{:id "577239117",
               :name "Free text questions",
               :type "FREE_TEXT",
               :order 1,
               :variableName "_free_question",
               :createdAt "2019-11-14T11:11:08.712Z",
               :modifiedAt "2020-03-09T11:01:22.869Z"}
              {:id "577259116",
               :name "Location",
               :type "GEO",
               :order 2,
               :variableName "_location_info",
               :createdAt "2019-11-14T11:11:23.573Z",
               :modifiedAt "2019-12-05T17:38:00.442Z"}
              {:id "569489117",
               :name "Numbers",
               :type "NUMBER",
               :order 3,
               :variableName "_number_question",
               :createdAt "2019-11-14T11:12:37.989Z",
               :modifiedAt "2019-12-03T14:30:55.556Z"}
              ],
             :createdAt "2019-11-14T11:09:48.764Z",
             :modifiedAt "2019-11-14T11:09:59.923Z"}
            {:id rqg-id,
             :name rqg-name,
             :repeatable true,
             :questions rqs,
             :createdAt "2019-12-05T17:27:26.146Z",
             :modifiedAt "2019-12-05T17:50:05.539Z"}],
           :createdAt "2019-11-14T11:09:12.723Z",
           :modifiedAt "2019-12-05T17:50:11.406Z",
           :formInstancesUrl
           "https://api-auth0.akvotest.org/flow/orgs/uat1/form_instances?survey_id=530819116&form_id=569469117",
           :registration-form? true})

(deftest rqg-in-one-column
  (let [secret "secret"]
    (testing "questions-responses-with-rqg-in-one-column"
      (let [res (flow-common/questions-with-rqg-in-one-column form)
            repeatables (filter :repeatable res)
            rqg (first repeatables)]
        (is (= (count res) 4))
        (is (= (count repeatables) 1))
        (is (= "RQG" (:type rqg)))
        (is (= rqg-name (:name rqg)))
        (is (= rqg-id (:id rqg)))
        (is (= (:metadata rqg) (common/coerce flow-common/question-type->lumen-type rqs))))
      )))

