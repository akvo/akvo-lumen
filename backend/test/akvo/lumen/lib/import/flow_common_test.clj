(ns akvo.lumen.lib.import.flow-common-test
  (:require [akvo.lumen.lib.import.flow-common :as flow-common]
            [clojure.test :refer :all]))

(def form-submission {:surveyalTime 88,
                      :dataPointId "598359137",
                      :deviceIdentifier "s7",
                      :displayName "Ivan",
                      :createdAt "2020-06-25T13:28:51.099Z",
                      :formId "633209136",
                      :submissionDate "2020-06-25T13:28:45Z",
                      :id "602269126",
                      :responses
                      {:619429141
                       [{:600019131 "Ivan",
                         :619419129 41,
                         :629229127
                         [{:name "France"}
                          {:name "Île-de-France"}
                          {:name "Paris"}
                          {:name "Paris, 16e arrondissement"}
                          {:name "Paris, 16e arrondissement"}
                          {:name "Paris, 16e arrondissement"}]}
                        {:619419129 3}
                        {:600019131 "Foo", :619419129 15}
                        {:629229127
                         [{:name "France"}
                          {:name "Île-de-France"}
                          {:name "Paris"}
                          {:name "Paris, 18e arrondissement"}
                          {:name "Paris, 18e arrondissement"}
                          {:name "Paris, 18e arrondissement"}]}]},
                      :identifier "fkrw-tcaf-8mt0",
                      :modifiedAt "2020-06-25T13:28:54.697Z",
                      :submitter "iperdomo"})


(let [data (-> form-submission :responses vals)
      responses-count (count (first data))]

  
  )

(deftest take-pos-test
  (testing "extract responses count"
    (let [vals-responses (-> form-submission :responses vals)]
      (is (= (flow-common/adapt-response-values false (first vals-responses))
             {:600019131 ["Ivan"],          
              :619419129 [41],
              :629229127
              [[{:name "France"}
                {:name "Île-de-France"}
                {:name "Paris"}
                {:name "Paris, 16e arrondissement"}
                {:name "Paris, 16e arrondissement"}
                {:name "Paris, 16e arrondissement"}]]}))
      (is (= (flow-common/adapt-response-values true (first vals-responses))
             {:600019131 ["Ivan" "Foo"],
              :619419129 [41 3 15],
              :629229127
              [[{:name "France"}
                {:name "Île-de-France"}
                {:name "Paris"}
                {:name "Paris, 16e arrondissement"}
                {:name "Paris, 16e arrondissement"}
                {:name "Paris, 16e arrondissement"}]
               [{:name "France"}
                {:name "Île-de-France"}
                {:name "Paris"}
                {:name "Paris, 18e arrondissement"}
                {:name "Paris, 18e arrondissement"}
                {:name "Paris, 18e arrondissement"}]]})))))


(deftest ensure-all-questions-exist
  (testing "flow only send values for questions that are filled"
    (let [questions [{:groupId "597899156",
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
        (is (= responses
               (flow-common/ensure-response-value questions responses ::missing))))
      (let [responses {"597899156" [{"609479145" [{"text" "yes", "code" "1"}],
                                     "594979148" 36.0}
                                    {"583119147" "Pol",
                                     "609479145" [{"text" "no", "code" "2"}],
                                     "594979148" 12.0}],
                       "617319144" [{"588869155" "Sevilla",
                                     "617309149" "Poppins"}]}]
        (is (= (assoc-in responses ["597899156" 0 "583119147"] ::missing)
               (flow-common/ensure-response-value questions responses ::missing))))
      (let [responses {"597899156" [{"609479145" [{"text" "yes", "code" "1"}],
                                     "594979148" 36.0}
                                    {"583119147" "Pol",
                                     "594979148" 12.0}],
                       "617319144" [{"588869155" "Sevilla",
                                     "617309149" "Poppins"}]}]
        (is (= (-> responses
                   (assoc-in  ["597899156" 0 "583119147"] ::missing)
                   (assoc-in  ["597899156" 1 "609479145"] ::missing))
               (flow-common/ensure-response-value questions responses ::missing))))
      (let [responses {"597899156" [{}
                                    {}],
                       "617319144" [{"617309149" "Poppins"}]}]
        (is (= {"617319144" [{"588869155" ::yikes
                              "617309149" "Poppins"}],
                "597899156" [{"583119147" ::yikes,
                              "594979148" ::yikes,
                              "609479145" ::yikes}
                             {"583119147" ::yikes,
                              "594979148" ::yikes,
                              "609479145" ::yikes}]}
               (flow-common/ensure-response-value questions responses ::yikes)))))))



