(ns akvo.lumen.lib.import.flow-common-test
  (:require [akvo.lumen.lib.import.flow-common :as flow-common]
            [clojure.test :refer [deftest testing is]]))

(def demo-form {:id "166189116",
                :name "Demo form",
                :questionGroups
                [{:id "166199115",
                  :name "Basic information",
                  :repeatable false,
                  :questions
                  [{:id "169799115",
                    :name "What is your name?",
                    :type "FREE_TEXT",
                    :order 1,
                    :variableName nil,
                    :createdAt "2017-07-21T12:14:12.388Z",
                    :modifiedAt "2017-07-21T12:25:14.494Z"}
                   {:id "166669142",
                    :name "How old are you",
                    :type "NUMBER",
                    :order 2,
                    :variableName nil,
                    :createdAt "2017-07-21T12:23:26.623Z",
                    :modifiedAt "2017-07-21T12:23:43.693Z"}
                   {:id "169679190",
                    :name
                    "How likely are you going to recommend Akvo Flow to a colleague or a friend? ",
                    :type "OPTION",
                    :order 3,
                    :variableName nil,
                    :createdAt "2017-07-21T12:18:41.989Z",
                    :modifiedAt "2017-07-21T12:25:14.951Z"}],
                  :createdAt "2017-07-21T12:14:01.596Z",
                  :modifiedAt "2017-07-21T12:14:14.435Z"}
                 {:id "581219119",
                  :name "Other Group",
                  :repeatable true,
                  :questions
                  [{:id "523129121",
                    :name "What is your name?",
                    :type "FREE_TEXT",
                    :order 1,
                    :variableName nil,
                    :createdAt "2019-11-19T10:15:12.915Z",
                    :modifiedAt "2019-11-19T10:15:24.755Z"}],
                  :createdAt "2019-11-19T10:15:01.380Z",
                  :modifiedAt "2019-11-19T15:35:11.927Z"}],
                :createdAt "2017-07-21T12:13:54.716Z",
                :modifiedAt "2019-11-19T10:39:49.567Z",
                :formInstancesUrl
                "https://api-auth0.akvotest.org/flow/orgs/uat1/form_instances?survey_id=169539266&form_id=166189116",
                :registration-form? false})

(deftest flow-common-questions
  (testing "duplicated questions suffix"
    (is (= (flow-common/questions demo-form)
           (-> (vec (mapcat :questions (:questionGroups demo-form)))
               (update-in [0 :name] #(format "%s (%s)" % (:name (first (:questionGroups demo-form)))))
               (update-in [3 :name] #(format "%s (%s)" % (:name (last (:questionGroups demo-form))))))))))
