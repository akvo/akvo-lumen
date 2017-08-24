(ns akvo.lumen.endpoint.public-test
  (:require [akvo.lumen.endpoint.share-test :as share-test]
            [akvo.lumen.fixtures :refer [migrate-tenant rollback-tenant]]
            [akvo.lumen.lib.public-impl :as public-impl]
            [akvo.lumen.lib.share :as share]
            [akvo.lumen.test-utils :refer [test-tenant test-tenant-conn]]
            [akvo.lumen.variant :as variant]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;


(def ^:dynamic *tenant-conn*)

(defn fixture [f]
  (migrate-tenant test-tenant)
  (binding [*tenant-conn* (test-tenant-conn test-tenant)]
    (f)
    (rollback-tenant test-tenant)))

(use-fixtures :once fixture)

(hugsql/def-db-fns "akvo/lumen/lib/dashboard.sql")

(deftest ^:functional public-data

  (testing "Non existing public share id."
    (let [r (public-impl/get-share *tenant-conn* "abc123")]
      (is (= nil (get r "error")))))

  (testing "Public visualiation share."
    (share-test/seed *tenant-conn* share-test/test-spec)
    (let [new-share (variant/value (share/fetch *tenant-conn*
                                                {"visualisationId"
                                                 (:visualisation-id share-test/test-spec)}))
          p         (public-impl/get-share *tenant-conn* (:id new-share))]
      (is (= (:visualisation-id p)
             (:visualisation-id share-test/test-spec)))
      (is (= (:id new-share)
             (:id p)))))

  (testing "Public dashboard share"
    (let [dashboard-id    (-> (all-dashboards *tenant-conn*) first :id)
          dashboard-share (variant/value (share/fetch *tenant-conn*
                                                      {"dashboardId" dashboard-id}))
          share           (public-impl/get-share *tenant-conn* (:id dashboard-share))
          share-data      (public-impl/response-data *tenant-conn* share)]
      (is (every? #(contains? share-data %)
                  ["dashboardId" "dashboards" "visualisations" "datasets"]))
      (is (= 1
             (count (get share-data "datasets"))))
      (is (= 1
             (count (get share-data "visualisations"))))
      (is (every? #(not (nil? %))
                  (vals share-data))))))
