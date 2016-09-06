(ns org.akvo.lumen.endpoint.share-test
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.lumen.component.tenant-manager :as tm]
            [org.akvo.lumen.lib.dashboard :as dashboard]
            [org.akvo.lumen.lib.share :as share]
            [org.akvo.lumen.fixtures :refer [db-fixture test-conn]]
            [org.akvo.lumen.util :refer [squuid gen-table-name]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helpers
;;;

(hugsql/def-db-fns "org/akvo/lumen/job-execution.sql")
(hugsql/def-db-fns "org/akvo/lumen/endpoint/visualisation.sql")
(hugsql/def-db-fns "org/akvo/lumen/job-execution.sql")

(defn dashboard-spec [v1-id v2-id]
  {"type"     "dashboard"
   "title"    "My first Dashboard"
   ;; "id"       dashboard-id ;; Not present on new
   "entities" {v1-id    {"id"   v1-id
                         "type" "visualisation"}
               v2-id    {"id"   v2-id
                         "type" "visualisation"}
               "text-1" {"id"      "text-1"
                         "type"    "text"
                         "content" "I am a text entity."}
               "text-2" {"id"      "text-2"
                         "type"    "text"
                         "content" "I am another text entity."}}
   "layout"   {v1-id    {"x" 1
                         "y" 0
                         "w" 0
                         "h" 0
                         "i" v1-id}
               v2-id    {"x" 1
                         "y" 0
                         "w" 0
                         "h" 0
                         "i" v2-id}
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
  (jdbc/execute! conn [(str "CREATE TABLE IF NOT EXISTS " (:table-name spec) " ("
                            "rnum serial PRIMARY KEY"
                            ");")])
  (jdbc/execute! conn [(str "CREATE TABLE IF NOT EXISTS " (:table-name-2 spec) " ("
                            "rnum serial PRIMARY KEY"
                            ");")])
  (jdbc/execute! conn [(str "CREATE TABLE IF NOT EXISTS " (:imported-table-name spec) " ("
                            "rnum serial PRIMARY KEY"
                            ");")])
  (jdbc/execute! conn [(str "CREATE TABLE IF NOT EXISTS " (:imported-table-name-2 spec) " ("
                            "rnum serial PRIMARY KEY"
                            ");")])

  (insert-data-source conn {:id (:data-source-id spec)
                            :spec "{}"})
  (insert-job-execution conn {:id (:job-execution-id spec)
                              :data-source-id (:data-source-id spec)})
  (insert-job-execution conn {:id (:job-execution-id-2 spec)
                              :data-source-id (:data-source-id spec)})
  (insert-dataset conn {:id          (:dataset-id spec)
                        :title       "Title"
                        :description "Description"})
  (insert-dataset conn {:id          (:dataset-id-2 spec)
                        :title       "Title"
                        :description "Description"})
  (insert-dataset-version conn {:id (squuid)
                                :dataset-id (:dataset-id spec)
                                :job-execution-id (:job-execution-id spec)
                                :table-name (:table-name spec)
                                :imported-table-name (:imported-table-name spec)
                                :version 1
                                :columns {}})
  (insert-dataset-version conn {:id (squuid)
                                :dataset-id (:dataset-id-2 spec)
                                :job-execution-id (:job-execution-id-2 spec)
                                :table-name (:table-name-2 spec)
                                :imported-table-name (:imported-table-name-2 spec)
                                :version 1
                                :columns {}})
  (upsert-visualisation conn {:id         (:visualisation-id spec)
                              :dataset-id (:dataset-id spec)
                              :name       "Visualisation"
                              :type       "pie"
                              :spec       {}
                              :author     {}})
  (upsert-visualisation conn {:id         (:visualisation2-id spec)
                              :dataset-id (:dataset-id-2 spec)
                              :name       "Visualisation"
                              :type       "bar"
                              :spec       {}
                              :author     {}})
  (dashboard/handle-new-dashboard conn (dashboard-spec (:visualisation-id spec)
                                                       (:visualisation2-id spec))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Test data
;;;



(def test-spec
  {:data-source-id        (str (squuid))
   :job-execution-id      (str (squuid))
   :job-execution-id-2    (str (squuid))
   :dataset-id            (str (squuid))
   :dataset-id-2          (str (squuid))
   :visualisation-id      (str (squuid))
   :visualisation2-id     (str (squuid))
   :table-name            (gen-table-name "ds")
   :table-name-2          (gen-table-name "ds")
   :imported-table-name   (gen-table-name "imported")
   :imported-table-name-2 (gen-table-name "imported")})


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(use-fixtures :once db-fixture)

(hugsql/def-db-fns "org/akvo/lumen/endpoint/share_test.sql")
(hugsql/def-db-fns "org/akvo/lumen/endpoint/dashboard.sql")

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
