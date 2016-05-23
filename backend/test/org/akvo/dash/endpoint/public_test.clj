(ns org.akvo.dash.endpoint.public-test
  (:require [clojure.test :refer :all]
            [clojure.pprint :refer [pprint]]
            [org.akvo.dash.endpoint.public :refer [get-share]]
            [org.akvo.dash.fixtures :refer [db-fixture test-conn]]
            [org.akvo.dash.endpoint.share :as share]
            [org.akvo.dash.endpoint.share-test :as share-test]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests data
;;;


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Tests
;;;

(use-fixtures :once db-fixture)

(deftest ^:functional public-data

  (testing "Non existing share id."
    (let [r (get-share test-conn "abc123")]
      (is (= nil (get r "error")))))

  (testing "Existing share."
    (share-test/seed test-conn share-test/test-spec)
    (let [new-share (share/share-visualisation test-conn
                                               (:visualisation-id share-test/test-spec))
          p (get-share test-conn (:id new-share))]
      (pprint new-share)
      (pprint p)
      (is (= (:visualisation_id p)
             (:visualisation-id share-test/test-spec)))
      (is (= (:id new-share)
             (:id p))))))
