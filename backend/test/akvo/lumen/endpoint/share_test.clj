(ns akvo.lumen.endpoint.share-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture]]
            [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.lib.share :as share]
            [akvo.lumen.util :refer [gen-table-name squuid]]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.endpoint.commons.variant :as variant]
            [clojure.java.jdbc :as jdbc]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Helpers
;;;

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")
(hugsql/def-db-fns "akvo/lumen/lib/dataset_version.sql")
(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")


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
  (postgres/create-dataset-table conn (:table-name spec) (:columns-ds-1 spec))
  (postgres/create-dataset-table conn (:table-name-2 spec) (:columns-ds-2 spec))
  (postgres/create-dataset-table conn (:imported-table-name spec) (:columns-ds-1 spec))
  (postgres/create-dataset-table conn (:imported-table-name-2 spec) (:columns-ds-2 spec))
  
  (insert-data-source conn {:id (:data-source-id spec)
                            :spec "{}"})
  (insert-job-execution conn {:id (:job-execution-id spec)
                              :data-source-id (:data-source-id spec)})
  (insert-job-execution conn {:id (:job-execution-id-2 spec)
                              :data-source-id (:data-source-id spec)})
  (insert-dataset conn {:id          (:dataset-id spec)
                        :title       "Title"
                        :description "Description"
                        :author {}
                        :source {}})
  (insert-dataset conn {:id          (:dataset-id-2 spec)
                        :title       "Title"
                        :description "Description"
                        :author {}
                        :source {}})
  (new-dataset-version conn {:id (squuid)
                             :dataset-id (:dataset-id spec)
                             :job-execution-id (:job-execution-id spec)
                             :table-name (:table-name spec)
                             :imported-table-name (:imported-table-name spec)
                             :version 1
                             :columns (:columns-ds-1 spec)
                             :transformations []})
  (new-dataset-version conn {:id (squuid)
                             :dataset-id (:dataset-id-2 spec)
                             :job-execution-id (:job-execution-id-2 spec)
                             :table-name (:table-name-2 spec)
                             :imported-table-name (:imported-table-name-2 spec)
                             :version 1
                             :columns (:columns-ds-2 spec)
                             :transformations []})
  (upsert-visualisation conn {:id         (:visualisation-id spec)
                              :dataset-id (:dataset-id spec)
                              :name       "Visualisation"
                              :type       "pie"
                              :spec       {:bucketColumn "c1" :filters []}
                              :author     {}})
  (upsert-visualisation conn {:id         (:visualisation2-id spec)
                              :dataset-id (:dataset-id-2 spec)
                              :name       "Visualisation"
                              :type       "bar"
                              :spec       {:bucketColumn "c1" :filters []}
                              :author     {}})
  (dashboard/create conn (dashboard-spec (:visualisation-id spec)
                                         (:visualisation2-id spec)) {}))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Test data
;;;

(def test-spec
  {:data-source-id        (str (squuid))
   :job-execution-id      (str (squuid))
   :job-execution-id-2    (str (squuid))
   :dataset-id            (str (squuid))
   :columns-ds-1          [{:title "Column 1", :type "text", :key false, :hidden false, :direction "", :sort nil, :columnName "c1" :id "c1"}]
   :dataset-id-2          (str (squuid))
   :columns-ds-2          [{:title "Column 1", :type "text", :key false, :hidden false, :direction "", :sort nil, :columnName "c1" :id "c1"}]
   :visualisation-id      (str (squuid))
   :visualisation2-id     (str (squuid))
   :table-name            (gen-table-name "ds")
   :table-name-2          (gen-table-name "ds")
   :imported-table-name   (gen-table-name "imported")
   :imported-table-name-2 (gen-table-name "imported")})


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(use-fixtures :once tenant-conn-fixture)


(hugsql/def-db-fns "akvo/lumen/lib/dashboard.sql")

(deftest ^:functional share

  (testing "Empty collection"
    (is (empty? (variant/value (share/all *tenant-conn*)))))

  (testing "Insert visualisation share"
    (seed *tenant-conn* test-spec)
    (let [new-share (variant/value (share/fetch *tenant-conn*
                                                {"visualisationId"
                                                 (:visualisation-id test-spec)}))
          r (variant/value (share/all *tenant-conn*))]
      (is (= 1 (count r)))
      (is (= (:id new-share) (:id (first r))))))

  (testing "New share on same item"
    (let [old-share-id (:id (first (variant/value (share/all *tenant-conn*))))
          new-share-id (:id (variant/value (share/fetch *tenant-conn*
                                                        {"visualisationId"
                                                         (:visualisation-id test-spec)})))]
      (is (= new-share-id old-share-id))))

  (testing "Remove share"
    (let [shares (variant/value (share/all *tenant-conn*))]
      (share/delete *tenant-conn* (:id (first shares)))
      (is (empty? (variant/value (share/all *tenant-conn*))))))

  (testing "Insert dashboard share"
    (let [dashboard-id (-> (all-dashboards *tenant-conn*) first :id)
          dashboard-share (variant/value (share/fetch *tenant-conn*
                                                      {"dashboardId" dashboard-id}))]
      (is (contains? dashboard-share :id)))))
