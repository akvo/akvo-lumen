(ns akvo.lumen.endpoint.collection-test
  {:functional true}
  (:require [akvo.lumen.fixtures :refer [*tenant-conn*
                                         tenant-conn-fixture
                                         system-fixture
                                         *error-tracker*
                                         error-tracker-fixture]]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.collection :as collection]
            [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.lib.visualisation :as visualisation]
            [akvo.lumen.test-utils :as tu]
            [akvo.lumen.test-utils :refer [import-file]]
            [akvo.lumen.endpoint.commons.variant :as variant]
            [clojure.test :refer :all]))


(use-fixtures :once system-fixture tenant-conn-fixture error-tracker-fixture tu/spec-instrument)

(defn visualisation-body [dataset-id]
  {"datasetId" dataset-id
   "visualisationType" ""
   "name" ""
   "spec" {}})

(defn create-visualisation [tenant-conn dataset-id auth-datasets]
  (-> (visualisation/create *tenant-conn* (visualisation-body dataset-id) {} auth-datasets)
      variant/value
      (get "id")))

(defn create-dashboard [tenant-conn auth-datasets]
  (-> (dashboard/create tenant-conn {"title" ""} {} auth-datasets)
      variant/value
      (get :id)))

(deftest ^:functional collection-test
  (let [;; Import a few datasets
        ds1 (import-file *tenant-conn* *error-tracker* {:file "GDP.csv"})
        ds2 (import-file *tenant-conn* *error-tracker* {:file "dates.csv"})
        auth-datasets [ds1 ds2]
        vs1 (create-visualisation *tenant-conn* ds1 auth-datasets)
        vs2 (create-visualisation *tenant-conn* ds2 auth-datasets)
        db1 (create-dashboard *tenant-conn* auth-datasets)
        db2 (create-dashboard *tenant-conn* auth-datasets)]
    (testing "Create an empty collection"
      (let [[tag collection] (collection/create *tenant-conn*
                                                {"title" "col1"} auth-datasets)]
        (is (= ::lib/created tag))
        (is (= #{:id :title :modified :created :entities}
               (-> collection keys set)))
        (is (= ::lib/conflict
               (first (collection/create *tenant-conn*
                                         {"title" "col1"} auth-datasets))))
        (is (= ::lib/bad-request
               (first (collection/create *tenant-conn*
                                         {"title" nil} auth-datasets))))
        (is (= ::lib/bad-request
               (first (collection/create *tenant-conn*
                                         {"title" (apply str (repeat 129 "a"))} auth-datasets))))))
    (testing "Create a collection with entities"
      (let [[tag collection] (collection/create *tenant-conn* {"title" "col2"
                                                               "entities" [ds1 vs1 db1]} auth-datasets)]
        (is (= ::lib/created tag))
        (is (= #{ds1 vs1 db1} (-> collection :entities set)))))

    (testing "Fetch collection"
      (let [id (-> (collection/create *tenant-conn*
                                      {"title" "col3" "entities" [ds2 vs2 db2]} auth-datasets)
                   variant/value :id)
            coll (variant/value (collection/fetch *tenant-conn* id auth-datasets))]
        (is (= #{ds2 vs2 db2} (-> coll :entities set)))))

    (testing "Update collection"
      (let [id (-> (collection/create *tenant-conn* {"title" "col4" "entities" [ds2 vs2 db2]} auth-datasets)
                   variant/value :id)]
        (let [coll (variant/value (collection/update *tenant-conn* id {"title" "col4 renamed"} auth-datasets))]
          (is (= (:title coll) "col4 renamed"))
          (is (= (-> coll :entities set)
                 #{ds2 vs2 db2}))
          (collection/update *tenant-conn* id {"entities" []} auth-datasets)
          (is (= [] (-> (collection/fetch *tenant-conn* id auth-datasets) variant/value :entities)))
          (collection/update *tenant-conn* id {"entities" [ds1 vs1]} auth-datasets)
          (is (= #{ds1 vs1} (-> (collection/fetch *tenant-conn* id auth-datasets) variant/value :entities set)))
          (collection/update *tenant-conn* id {"entities" [vs1 vs2]} auth-datasets)
          (is (= #{vs1 vs2} (-> (collection/fetch *tenant-conn* id auth-datasets) variant/value :entities set))))))

    (testing "Delete collection"
      (let [id (-> (collection/create *tenant-conn* {"title" "col5"} auth-datasets) variant/value :id)]
        (collection/delete *tenant-conn* id auth-datasets)
        (is (= ::lib/not-found (variant/tag (collection/fetch *tenant-conn* id auth-datasets))))))

    (testing "Delete collection entities"
      (let [id (-> (collection/create *tenant-conn* {"title" "col6"
                                                     "entities" [ds1 ds2 vs1 vs2 db1 db2]} auth-datasets)
                   variant/value :id)]
        (dashboard/delete *tenant-conn* db1 auth-datasets)
        (is (= #{ds1 ds2 vs1 vs2 db2}
               (-> (collection/fetch *tenant-conn* id auth-datasets)
                   variant/value :entities set)))
        (dataset/delete *tenant-conn* ds1)
        (is (= #{ds2 vs2 db2}
               (-> (collection/fetch *tenant-conn* id auth-datasets)
                   variant/value :entities set)))))))
