(ns akvo.lumen.endpoint.public-test
  {:functional true}
  (:require [akvo.lumen.endpoint.commons.variant :as variant]
            [akvo.lumen.endpoint.share-test :as share-test]
            [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture]]
            [akvo.lumen.lib.public :as public]
            [akvo.lumen.lib.share :as share]
            [akvo.lumen.test-utils :as tu]
            [clojure.test :refer :all]
            [hugsql.core :as hugsql]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;


(use-fixtures :once tenant-conn-fixture tu/spec-instrument)

(hugsql/def-db-fns "akvo/lumen/lib/dashboard.sql")

(deftest ^:functional public-data

  (testing "Non existing public share id."
    (let [r (public/get-share *tenant-conn* "abc123")]
      (is (= nil (get r "error")))))

  (testing "Public visualiation share."
    (share-test/seed *tenant-conn* share-test/test-spec)
    (let [new-share (variant/value (share/fetch *tenant-conn*
                                                {"visualisationId"
                                                 (:id (:vis-1 share-test/test-spec))}))
          p         (public/get-share *tenant-conn* (:id new-share))]
      (is (= (:visualisation-id p)
             (:id (:vis-1 share-test/test-spec))))
      (is (= (:id new-share)
             (:id p)))))

  (testing "Public dashboard share"
    (let [dashboard-id    (-> (all-dashboards *tenant-conn*) first :id)
          dashboard-share (variant/value (share/fetch *tenant-conn*
                                                      {"dashboardId" dashboard-id}))
          share           (public/get-share *tenant-conn* (:id dashboard-share))
          share-data      (public/response-data *tenant-conn* share {})]
      (is (every? #(contains? share-data %)
                  [:dashboardId :dashboards :visualisations :datasets]))
      (is (= 2
             (count (get share-data :datasets))))
      (is (= 2
             (count (get share-data :visualisations))))
      (is (every? #(not (nil? %))
                  (vals share-data))))))
