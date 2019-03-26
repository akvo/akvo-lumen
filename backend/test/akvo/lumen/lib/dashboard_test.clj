(ns akvo.lumen.lib.dashboard-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         system-fixture]]
            [akvo.lumen.lib.dashboard :as dashboard]
            [clojure.test :refer :all]))

(defn dashboard-spec [v-id]
  {"type"     "dashboard"
   "title"    "My first Dashboard"
   ;; "id"       dashboard-id ;; Not present on new
   "entities" {v-id     {"id"   v-id
                         "type" "visualisation"
                         ;;"visualisation" v-id ;; data?
                         }
               "text-1" {"id"      "text-1"
                         "type"    "text"
                         "content" "I am a text entity."}
               "text-2" {"id"      "text-2"
                         "type"    "text"
                         "content" "I am another text entity."}}
   "layout"   {v-id     {"x" 1
                         "y" 0
                         "w" 0
                         "h" 0
                         "i" v-id}
               "text-1" {"x" 2
                         "y" 0
                         "w" 0
                         "h" 0
                         "i" "text-1"}
               "text-2" {"x" 3
                         "y" 0
                         "w" 0
                         "h" 0
                         "i" "text-2"}}})

(deftest dashboard-unit
  (testing "filter-type"
    (is (= (dashboard/filter-type (dashboard-spec "abc123") "text")
           {:entities
	   '({:id "text-1", :type "text", :content "I am a text entity."}
	    {:id "text-2", :type "text", :content "I am another text entity."}),
	   :layout
	   '({:x 2, :y 0, :w 0, :h 0, :i "text-1"}
	    {:x 3, :y 0, :w 0, :h 0, :i "text-2"})}))))
