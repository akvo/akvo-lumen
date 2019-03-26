(ns akvo.lumen.endpoint.dashboard-test
  {:functional true}
  (:require [akvo.lumen.endpoint.share-test :as share-test]
            [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         system-fixture]]
            [akvo.lumen.lib.dashboard-test :refer [dashboard-spec]]
            [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.endpoint.commons.variant :as variant]
            [akvo.lumen.test-utils :as tu]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]))

(use-fixtures :once system-fixture tenant-conn-fixture tu/spec-instrument)

(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")
(hugsql/def-db-fns "akvo/lumen/lib/dashboard.sql")

(deftest ^:functional dashboard
  (let [auth-ds (share-test/seed *tenant-conn* share-test/test-spec)]
    (testing "Dashboard"
      (let [v-id               (-> (all-visualisations *tenant-conn*) first :id)
            d-spec             (dashboard-spec v-id)
            {dashboard-id :id} (variant/value (dashboard/create *tenant-conn* d-spec {} auth-ds))]
        (is (not (nil? dashboard-id)))

        (testing "Get dashboard"
          (let [d (variant/value (dashboard/auth-fetch *tenant-conn* dashboard-id auth-ds))]
            (is (not (nil? d)))
            (is (every? #(contains? d %)
                        [:id :title :entities :layout :type :status :created
                         :modified]))
            (is (= (get d-spec "title")
                   (get d :title)))
            (is (= (set (mapv name (keys (:entities d))))
                   (set (mapv name (keys (get d-spec "entities"))))))

            (is (= (set (mapv name (keys (:layout d))))
                   (set (mapv name (keys (get d-spec "layout"))))))))

        (testing "Update dashboard"
          (let [new-spec (-> d-spec
                             (assoc "title" "My updated dashboard")
                             (assoc-in ["entities" "text-1" "content"]
                                       "Updated text entity")
                             (assoc-in ["layout" "text-1" "h"] 1))]

            (dashboard/upsert *tenant-conn* dashboard-id new-spec auth-ds)
            (let [updated-d (variant/value (dashboard/auth-fetch *tenant-conn* dashboard-id auth-ds))]
              (is (= (:title updated-d)
                     "My updated dashboard"))
              (is (= (get-in updated-d [:entities "text-1" "content"])
                     "Updated text entity"))
              (is (= (get-in updated-d [:layout "text-1" "h"])
                     1)))))

        (testing "Delete dashboard"
          (dashboard/delete *tenant-conn* dashboard-id auth-ds)
          (is (nil? (dashboard-by-id *tenant-conn* {:id dashboard-id})))
          (is (empty? (dashboard_visualisation-by-dashboard-id
                       *tenant-conn* {:dashboard-id dashboard-id})))
          (is (= (count (all-dashboards *tenant-conn*))
                 1)))))))
