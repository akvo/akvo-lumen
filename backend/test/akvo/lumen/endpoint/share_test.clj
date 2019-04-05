(ns akvo.lumen.endpoint.share-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         system-fixture]]
            [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.lib.share :as share]
            [akvo.lumen.util :refer [gen-table-name squuid]]
            [akvo.lumen.endpoint.commons.variant :as variant]
            [clojure.java.jdbc :as jdbc]
            [akvo.lumen.test-utils :as tu]
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


(defn seed* [conn vis-spec]
  (let [data {:columns [{:id "c1", :title "A", :type "text"}
                        {:id "c2", :title "B", :type "number"}
                        {:id "c3", :title "C", :type "date"}]
              :rows    [[{:value "a"} {:value 1} {:value (tu/instant-date "01/02/2019")}]
                        [{:value "b"} {:value 2} {:value (tu/instant-date "02/02/2019")}]
                        [{:value "c"} {:value 3} {:value (tu/instant-date "03/02/2019")}]
                        [{:value "c"} {:value 4} {:value (tu/instant-date "04/02/2019")}]]}

        [_ job] (tu/import-file conn {} {:dataset-name "scatter"
                                                        :kind "clj"
                                                        :with-job? true
                                                        :data data})
        dataset-id (:dataset_id job)
        data-source-id (:data_source_id job)]

    (create-visualisation conn (merge vis-spec {:dataset-id dataset-id :auth-datasets [dataset-id]}))
    {:visualisation-id (:id vis-spec) :dataset-id dataset-id :data-source-id data-source-id}))

(defn seed
  [conn spec]
  (seed* conn (:vis-1 spec))
  (seed* conn (:vis-2 spec))
  (dashboard/create conn (dashboard-spec (:id (:vis-1 spec))
                                         (:id (:vis-2 spec))) {}))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Test data
;;;

(def test-spec
  {:vis-1 {:id         (str (squuid))
           :name       "Visualisation"
           :type       "pie"
           :spec       {:bucketColumn "c1" :filters []}
           :author     {}}
   :vis-2 {:id         (str (squuid))
           :name       "Visualisation"
           :type       "bar"
           :spec       {:bucketColumn "c1" :filters []}
           :author     {}}
   })


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(use-fixtures :once system-fixture tenant-conn-fixture tu/spec-instrument)


(hugsql/def-db-fns "akvo/lumen/lib/dashboard.sql")

(deftest ^:functional share
  (testing "Empty collection"
    (is (empty? (variant/value (share/all *tenant-conn*)))))

  (testing "Insert visualisation share"
    (seed *tenant-conn* test-spec)
    (let [new-share (variant/value (share/fetch *tenant-conn*
                                                {"visualisationId"
                                                 (:id (:vis-1 test-spec))}))
          r (variant/value (share/all *tenant-conn*))]
      (is (= 1 (count r)))
      (is (= (:id new-share) (:id (first r))))))

  (testing "New share on same item"
    (let [old-share-id (:id (first (variant/value (share/all *tenant-conn*))))
          new-share-id (:id (variant/value (share/fetch *tenant-conn*
                                                        {"visualisationId"
                                                         (:id (:vis-1 test-spec))})))]
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
