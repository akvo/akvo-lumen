(ns org.akvo.dash.endpoint.public-test
  (:require [clojure.test :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.endpoint
             [public :as public]
             [share :as share]
             [share-test :as share-test]]
            [org.akvo.dash.fixtures :refer [db-fixture test-conn]]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(use-fixtures :once db-fixture)

(hugsql/def-db-fns "org/akvo/dash/endpoint/dashboard.sql")

(deftest ^:functional public-data

  (testing "Non existing public share id."
    (let [r (public/get-share test-conn "abc123")]
      (is (= nil (get r "error")))))

  (testing "Public visualiation share."
    (share-test/seed test-conn share-test/test-spec)
    (let [new-share (share/share-visualisation
                     test-conn (:visualisation-id share-test/test-spec))
          p         (public/get-share test-conn (:id new-share))]
      (is (= (:visualisation_id p)
             (:visualisation-id share-test/test-spec)))
      (is (= (:id new-share)
             (:id p)))))

  (testing "Public dashboard share"
    (let [dashboard-id    (-> (all-dashboards test-conn) first :id)
          dashboard-share (share/share-dashboard test-conn dashboard-id)
          share           (public/get-share test-conn (:id dashboard-share))
          share-data      (public/response-data test-conn share)]
      (is (every? #(contains? share-data %)
                  ["dashboard" "visualisations" "datasets"]))

      (is (= 2
             (count (get share-data "datasets"))))
      (is (= 2
             (count (get share-data "visualisations"))))
      (is (every? #(not (nil? %))
                    (vals share-data))))))
