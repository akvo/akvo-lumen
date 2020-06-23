(ns akvo.lumen.lib.import-test
  (:require [akvo.lumen.lib.import :as import]
            [clojure.test :refer :all]))

(def columns {"main"
              {:columns
               [{:title "Display name",
                 :type "text",
                 :id "display_name",
                 :groupName "metadata",
                 :groupId "metadata",
                 :ns "main"}
                {:title "Submitter",
                 :type "text",
                 :id "submitter",
                 :groupName "metadata",
                 :groupId "metadata",
                 :ns "main"}
                {:title "Family name",
                 :type "text",
                 :groupId "617319144",
                 :metadata nil,
                 :ns "main",
                 :groupName "Non repeatable",
                 :id "c617309149"}],
               :table-name "table_1"},
              "597899156"
              {:columns
               [{:title "Name",
                 :type "text",
                 :groupId "597899156",
                 :metadata nil,
                 :ns "597899156",
                 :groupName "Repeated",
                 :id "c583119147"}
                {:title "Age",
                 :type "number",
                 :groupId "597899156",
                 :metadata nil,
                 :ns "597899156",
                 :groupName "Repeated",
                 :id "c594979148"}],
               :table-name "table_2"}})

(def record {:display_name "User1"
          :submitter "User1 "
          "c617309149" "Foo"
          "c583119147" "Bar"
          "c594979148" 30.0})

(deftest import-test
  (testing "group-record-by-table-test"
    (is (= (import/group-record-by-table columns record)
           {"table_1"{:display_name "User1", :submitter "User1 ", :c617309149 "Foo"},
            "table_2" {:c583119147 "Bar", :c594979148 30.0}}))))
