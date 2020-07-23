(ns akvo.lumen.lib.import.flow-common-test
  (:require [akvo.lumen.lib.import.flow-common :as flow-common]
            [clojure.test :refer :all]))

(deftest double-check
  (testing "flow only send values for questions that are filled"
    (let [groups [{:id "597899156"
                   :name "Repeated"
                   :repeatable true}
                  {:id "617319144"
                   :name "Non repeatable"
                   :repeatable false}]
          questions [{:groupId "597899156",
                      :name "Name",
                      :groupName "Repeated",
                      :createdAt "2020-06-09T13:47:32.786Z",
                      :type "FREE_TEXT",
                      :personalData false,
                      :variableName nil,
                      :id "583119147",
                      :order 1,
                      :modifiedAt "2020-06-09T13:47:53.534Z"}
                     {:groupId "597899156",
                      :name "Age",
                      :groupName "Repeated",
                      :createdAt "2020-06-09T13:47:34.083Z",
                      :type "NUMBER",
                      :personalData false,
                      :variableName nil,
                      :id "594979148",
                      :order 2,
                      :modifiedAt "2020-06-09T13:48:07.215Z"}
                     {:groupId "597899156",
                      :name "Likes Pizza",
                      :groupName "Repeated",
                      :createdAt "2020-06-09T13:47:35.352Z",
                      :type "OPTION",
                      :personalData false,
                      :variableName nil,
                      :id "609479145",
                      :order 3,
                      :modifiedAt "2020-06-09T13:48:57.306Z"}
                     {:groupId "617319144",
                      :name "Family name",
                      :groupName "Non repeatable",
                      :createdAt "2020-06-09T13:46:35.817Z",
                      :type "FREE_TEXT",
                      :personalData false,
                      :variableName nil,
                      :id "617309149",
                      :order 1,
                      :modifiedAt "2020-06-09T13:47:25.423Z"}
                     {:groupId "617319144",
                      :name "Location",
                      :groupName "Non repeatable",
                      :createdAt "2020-06-09T13:47:05.152Z",
                      :type "FREE_TEXT",
                      :personalData false,
                      :variableName nil,
                      :id "588869155",
                      :order 2,
                      :modifiedAt "2020-06-09T13:47:20.516Z"}]]
      (let [responses {"597899156" [{"583119147" "Mary",
                                     "609479145" [{"text" "yes", "code" "1"}],
                                     "594979148" 36.0}
                                    {"583119147" "Pol",
                                     "609479145" [{"text" "no", "code" "2"}],
                                     "594979148" 12.0}],
                       "617319144" [{"588869155" "Sevilla",
                                     "617309149" "Poppins"}]}]
        (is (= [{"588869155" "Sevilla", "617309149" "Poppins"}          
                {"583119147" "Mary",
                 "609479145" [{"text" "yes", "code" "1"}],
                 "594979148" 36.0}]
               (flow-common/question-responses groups questions responses))))
      (let [responses {"597899156" [{"609479145" [{"text" "yes", "code" "1"}],
                                     "594979148" 36.0}
                                    {"583119147" "Pol",
                                     "609479145" [{"text" "no", "code" "2"}],
                                     "594979148" 12.0}],
                       "617319144" [{"588869155" "Sevilla",
                                     "617309149" "Poppins"}]}]
        (is (= [{"588869155" "Sevilla", "617309149" "Poppins"}          
                {"609479145" [{"text" "yes", "code" "1"}], "594979148" 36.0}]
               (flow-common/question-responses groups questions responses))))
      (let [responses {"597899156" [{"609479145" [{"text" "yes", "code" "1"}],
                                     "594979148" 36.0}
                                    {"583119147" "Pol",
                                     "594979148" 12.0}],
                       "617319144" [{"588869155" "Sevilla",
                                     "617309149" "Poppins"}]}]
        (is (= [{"588869155" "Sevilla", "617309149" "Poppins"}          
                {"609479145" [{"text" "yes", "code" "1"}], "594979148" 36.0}]
               (flow-common/question-responses groups questions responses))))
      (let [responses {"597899156" [{}
                                    {}],
                       "617319144" [{"617309149" "Poppins"}]}]
        (is (= [{"617309149" "Poppins"} {}]
               (flow-common/question-responses groups questions responses)))))))
