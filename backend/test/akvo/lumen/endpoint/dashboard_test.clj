(ns akvo.lumen.endpoint.dashboard-test
  {:functional true}
  (:require [akvo.lumen.endpoint.share-test :as share-test]
            [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         system-fixture]]
            [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.endpoint.commons.variant :as variant]
            [clojure.walk :as w]
            [akvo.lumen.test-utils :as tu]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Test data
;;;

(defn dashboard-spec [v-id]
  {:type     "dashboard"
   :title    "My first Dashboard"
   ;; :id       dashboard-id ;; Not present on new
   :entities {(keyword  v-id) {:id   v-id
                               :type "visualisation"
                               ;; :visualisation v-id ;; data?
                               }
              :text-1         {:id      "text-1"
                               :type    "text"
                               :content "I am a text entity."}
              :text-2         {:id      "text-2"
                               :type    "text"
                               :content "I am another text entity."}}
   :layout   {(keyword  v-id) {:x 1
                               :y 0
                               :w 0
                               :h 0
                               :i v-id}
              :text-1         {:x 2
                               :y 0
                               :w 0
                               :h 0
                               :i "text-1"}
              :text-2         {:x 3
                               :y 0
                               :w 0
                               :h 0
                               :i "text-2"}}})


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(use-fixtures :once system-fixture tenant-conn-fixture tu/spec-instrument)


(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")
(hugsql/def-db-fns "akvo/lumen/lib/dashboard.sql")

(deftest dashboard-unit
  (testing "filter-type"
    (is (= (dashboard/filter-type (dashboard-spec "abc123") "text")
           {:entities
            '({:id "text-1", :type "text", :content "I am a text entity."}
              {:id "text-2", :type "text", :content "I am another text entity."})
            :layout
            '({:x 2, :y 0, :w 0, :h 0, :i "text-1"}
              {:x 3, :y 0, :w 0, :h 0, :i "text-2"})}))))


(deftest ^:functional dashboard
  (share-test/seed *tenant-conn* share-test/test-spec)

  (testing "Dashboard"
    (let [v-id               (-> (all-visualisations *tenant-conn*) first :id)
          d-spec             (dashboard-spec v-id)
          {dashboard-id :id} (variant/value (dashboard/create *tenant-conn* d-spec {}))]
      (is (not (nil? dashboard-id)))

      (testing "Get dashboard"
        (let [d (dashboard/fetch *tenant-conn* dashboard-id)]
          (is (not (nil? d)))
          (is (every? #(contains? d %)
                      [:id :title :entities :layout :type :status :created
                       :filter :modified]))
          (is (= (get d-spec :title)
                 (get d :title)))
          (is (= (set (mapv name (keys (:entities d))))
                 (set (mapv name (keys (:entities d-spec))))))
          (is (= (set (mapv name (keys (:layout d))))
                 (set (mapv name (keys (:layout d-spec))))))))

      (testing "Update dashboard"
        (let [new-spec (-> d-spec
                           (assoc :title "My updated dashboard")
                           (assoc-in [:entities :text-1 :content]
                                     "Updated text entity")
                           (assoc-in [:layout :text-1 :h] 1))]

          (dashboard/upsert *tenant-conn* dashboard-id new-spec)
          (let [updated-d (dashboard/fetch *tenant-conn* dashboard-id)]
            (is (= (:title updated-d)
                   "My updated dashboard"))
            (is (= (get-in updated-d [:entities :text-1 :content])
                   "Updated text entity"))
            (is (= (get-in updated-d [:layout :text-1 :h])
                   1)))))

      (testing "Delete dashboard"
        (dashboard/delete *tenant-conn* dashboard-id)
        (is (nil? (dashboard-by-id *tenant-conn* {:id dashboard-id})))
        (is (empty? (dashboard_visualisation-by-dashboard-id
                     *tenant-conn* {:dashboard-id dashboard-id})))
        (is (= (count (all-dashboards *tenant-conn*))
               1))))))
