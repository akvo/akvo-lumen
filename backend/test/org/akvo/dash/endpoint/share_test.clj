(ns org.akvo.dash.endpoint.share-test
  (:require [clojure.pprint :refer [pprint]]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :as tm]
            [org.akvo.dash.endpoint.share :as share]
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
                              :author     "{}"}))

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

(deftest ^:functional share

  (testing "Empty collection"
    (is (empty? (share/collection test-conn))))

  (testing "Insert share"
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

  (testing "History"
    (is (not (empty? (share-history test-conn))))))
