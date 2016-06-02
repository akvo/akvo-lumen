(ns org.akvo.dash.endpoint.share-test
  (:require [clojure.test :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :as tm]
            [org.akvo.dash.endpoint.share :as share]
            [org.akvo.dash.endpoint.dashboard :as dashboard]
            [org.akvo.dash.fixtures :refer [db-fixture test-conn]]
            [org.akvo.dash.util :refer [squuid]]
            [ragtime
             [jdbc :as jdbc]
             [repl :as repl]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helpers
;;;

(hugsql/def-db-fns "org/akvo/dash/job-execution.sql")
(hugsql/def-db-fns "org/akvo/dash/endpoint/visualisation.sql")

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

(defn seed
  [conn spec]
  (insert-data-source conn {:id   (:data-source-id spec)
                            :spec "{}"})
  (insert-dataset conn {:id          (:dataset-id spec)
                        :title       "Title"
                        :description "Description"})
  (insert-visualisation conn {:id         (:visualisation-id spec)
                              :dataset-id (:dataset-id spec)
                              :name       "Visualisation"
                              :type       "pie"
                              :spec       "{}"
                              :author     "{}"})
  (dashboard/handle-new-dashboard conn (dashboard-spec (:visualisation-id spec))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Test data
;;;



(def test-spec
  {:data-source-id   (str (squuid))
   :dataset-id       (str (squuid))
   :visualisation-id (str (squuid))})


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(use-fixtures :once db-fixture)

(hugsql/def-db-fns "org/akvo/dash/endpoint/share_test.sql")
(hugsql/def-db-fns "org/akvo/dash/endpoint/dashboard.sql")

(deftest ^:functional share

  (testing "Empty collection"
    (is (empty? (share/collection test-conn))))

  (testing "Insert visualisation share"
    (seed test-conn test-spec)
    (let [new-share (share/share-visualisation test-conn
                                               (:visualisation-id test-spec))
          r         (share/collection test-conn)]
      (is (= 1 (count r)))
      (is (= (:id new-share) (:id (first r))))))

  (testing "New share on same item"
    (let [old-share-id (:id (first (share/collection test-conn)))
          new-share-id (:id (share/share-visualisation test-conn
                                                       (:visualisation-id test-spec)))]
      (is (= new-share-id old-share-id))))

  (testing "Remove share"
    (let [shares (share/collection test-conn)]
      (share/end-share test-conn (:id (first shares)))
      (is (empty? (share/collection test-conn)))))

  (testing "Insert dashboard share"
    (let [dashboard-id (-> (all-dashboards test-conn) first :id)
          dashboard-share (share/share-dashboard test-conn dashboard-id)]
      (is (contains? dashboard-share :id))))

  (testing "History"
    (is (not (empty? (share-history test-conn))))))
