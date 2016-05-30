(ns org.akvo.dash.endpoint.dashboard-test
  (:require [clojure.test :refer :all]
            [clojure.pprint :refer [pprint]]
            [hugsql.core :as hugsql]
            [org.akvo.dash.fixtures :refer [db-fixture test-conn]]
            [org.akvo.dash.endpoint.share :as share]
            [org.akvo.dash.endpoint.dashboard :as dashboard]
            [org.akvo.dash.endpoint.share-test :as share-test]
            [org.akvo.dash.util :refer [squuid]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Test data
;;;

;; (def v-id
;;   (str (squuid)))

;; (def dashboard-id
;;   (str (squuid)))

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

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(use-fixtures :once db-fixture)

(hugsql/def-db-fns "org/akvo/dash/endpoint/visualisation.sql")
(hugsql/def-db-fns "org/akvo/dash/endpoint/dashboard.sql")

(deftest ^:functional dashboard
  (share-test/seed test-conn share-test/test-spec)

  (testing "New dashboard"

    (let [v-id          (-> (all-visualisations test-conn) first :id)
          new-dashboard (dashboard/handle-new-dashboard test-conn
                                                        (dashboard-spec v-id))]
      (is (not (nil? new-dashboard)))

      (testing "Get dashboard"
        (let [d (dashboard/handle-dashboard-by-id test-conn (:id new-dashboard))]
          ;;(pprint d)
          (is
           (every? #(contains? d %) [:id :title :entities :layout
                                     :created :modified]))
          (is (not (nil? d)))))

      #_(testing "Update dashboard"
        (let [e (dashboard/persist-dashboard test-conn
                                             (:id new-dashboard)
                                             (:spec new-dashboard))
              ]
          (pprint e)
          (is (= 1 1)))))))
