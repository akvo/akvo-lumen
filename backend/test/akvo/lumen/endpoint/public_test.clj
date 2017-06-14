(ns akvo.lumen.endpoint.public-test
  (:require [akvo.lumen.endpoint
             [public :as public]
             [share-test :as share-test]]
            [akvo.lumen.fixtures :refer [db-fixture test-conn]]
            [akvo.lumen.lib.public-impl :as public-impl]
            [akvo.lumen.lib.share :as share]
            [akvo.lumen.variant :as variant]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(use-fixtures :once db-fixture)

(hugsql/def-db-fns "akvo/lumen/lib/dashboard.sql")

(deftest ^:functional public-data

  (testing "Non existing public share id."
    (let [r (public-impl/get-share test-conn "abc123")]
      (is (= nil (get r "error")))))

  (testing "Public visualiation share."
    (share-test/seed test-conn share-test/test-spec)
    (let [new-share (variant/value (share/fetch test-conn
                                                {"visualisationId"
                                                 (:visualisation-id share-test/test-spec)}))
          p         (public-impl/get-share test-conn (:id new-share))]
      (is (= (:visualisation-id p)
             (:visualisation-id share-test/test-spec)))
      (is (= (:id new-share)
             (:id p)))))

  (testing "Public dashboard share"
    (let [dashboard-id    (-> (all-dashboards test-conn) first :id)
          dashboard-share (variant/value (share/fetch test-conn
                                                      {"dashboardId" dashboard-id}))
          share           (public-impl/get-share test-conn (:id dashboard-share))
          share-data      (public-impl/response-data test-conn share)]
      (is (every? #(contains? share-data %)
                  ["dashboardId" "dashboards" "visualisations" "datasets"]))
      (is (= 1
             (count (get share-data "datasets"))))
      (is (= 1
             (count (get share-data "visualisations"))))
      (is (every? #(not (nil? %))
                  (vals share-data))))))
