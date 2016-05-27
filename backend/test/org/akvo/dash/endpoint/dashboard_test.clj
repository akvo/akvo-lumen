(ns org.akvo.dash.endpoint.dashboard-test
  (:require [clojure.test :refer :all]
            [clojure.pprint :refer [pprint]]
            [hugsql.core :as hugsql]
            [org.akvo.dash.fixtures :refer [db-fixture test-conn]]
            [cheshire.core :as json]
            [org.akvo.dash.endpoint.share :as share]
            [org.akvo.dash.endpoint.dashboard :as dashboard]
            [org.akvo.dash.endpoint.share-test :as share-test]
            [org.akvo.dash.util :refer [squuid]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Test data
;;;

(def v-id
  (str (squuid)))

(def d1
  {"type"     "dashboard"
   "title"    "My first Dashboard"
   "id"       (str (squuid))
   "entities" {v-id {"id"            v-id
                     "type"          "visualisation"
                     ;;"visualisation" (:visualisation-id share-test/test-spec)
                     }
               "id2" {"id" "id2"
                      "type" "text"
                      "content" "I am a text entity."}
               "id4" {"id" "id4"
                      "type" "text"
                      "content" "I am another text entity."}}
   "layout" {v-id {"x" 1
                    "y" 0
                    "w" 0
                    "h" 0
                    "i" v-id}
             "id2" {"x" 2
                    "y" 0
                    "w" 0
                    "h" 0
                    "i" "id2"}
             "id3" {"x" 3
                    "y" 0
                    "w" 0
                    "h" 0
                    "i" "id3"}
             "id4" {"x" 4
                    "y" 0
                    "w" 0
                    "h" 0
                    "i" "id4"}}})

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(use-fixtures :once db-fixture)

;; (map #(get % "id") '({"id" 1} {"id" 2}))

;; (filter #{"id1" "id2"} '({"id" 1} {"id" 2}))

;; (keep (#{"id2"} "id") ({"id" "id1"} {"id" "id2"}))

;; (keep #(#{"id1" "id2"} (get % "id") )
;;       [{"id" "id1"}  {"id" "id2"} {"id" "id3"}])

;; (pprint
;;  (let [entities (get (json/decode d1) "entities")]
;;    (filter #(= "visualisation"
;;                (get % "type"))
;;            (vals entities))))

;; (println "--")



(deftest ^:functional dashboard

  (testing "New dashboard"
    (share-test/seed test-conn share-test/test-spec)
    (dashboard/handle-new-dashboard test-conn d1)
    (is (= 1 1))
    ))
