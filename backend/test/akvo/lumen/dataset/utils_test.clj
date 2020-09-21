(ns akvo.lumen.lib.dataset.utils-test
  (:require [clojure.test :refer :all]
            [akvo.lumen.lib.dataset.utils :as dutils]
            [clojure.walk :as w])
  (:import [java.time Instant]))

(def data
  [[[{"op" "core/rename-column",
      "args" {"columnName" "c583119147", "newColumnTitle" "nombre"},
      "created" "2020-09-08T14:31:07.745Z",
      "onError" "fail",
      "namespace" "597899156",
      "dataset-id" "5f5619ec-e2a6-4e0e-a33a-5bf3d9f3b2dc",
      "changedColumns"
      {"c583119147"
       {"after"
        {"groupId" "597899156",
         "key" false,
         "groupName" "Repeated",
         "sort" nil,
         "direction" nil,
         "title" "nombre",
         "type" "text",
         "multipleType" nil,
         "hidden" false,
         "multipleId" nil,
         "columnName" "c583119147"},
        "before"
        {"groupId" "597899156",
         "key" false,
         "groupName" "Repeated",
         "sort" nil,
         "direction" nil,
         "title" "Name",
         "type" "text",
         "multipleType" nil,
         "hidden" false,
         "multipleId" nil,
         "columnName" "c583119147"}}}}] "597899156"]
   [[{"op" "core/rename-column",
      "args" {"columnName" "identifier", "newColumnTitle" "id"},
      "created" "2020-09-08T14:30:56.577Z",
      "onError" "fail",
      "namespace" "main",
      "dataset-id" "5f5619ec-e2a6-4e0e-a33a-5bf3d9f3b2dc",
      "changedColumns"
      {"identifier"
       {"after"
        {"groupId" "metadata",
         "key" false,
         "groupName" "metadata",
         "sort" nil,
         "direction" nil,
         "title" "id",
         "type" "text",
         "multipleType" nil,
         "hidden" false,
         "multipleId" nil,
         "columnName" "identifier"},
        "before"
        {"groupId" "metadata",
         "key" false,
         "groupName" "metadata",
         "sort" nil,
         "direction" nil,
         "title" "Identifier",
         "type" "text",
         "multipleType" nil,
         "hidden" false,
         "multipleId" nil,
         "columnName" "identifier"}}}}] "main"]])

(deftest ^:unit unify-history-test
  (let [data-kw (map first data)
        txs (map first data-kw)]
    (is (= "2020-09-08T14:31:07.745Z" (get (first txs) "created")))
    (is (= "2020-09-08T14:30:56.577Z" (get (last txs) "created")))
    (let [dsvs (map (fn [txs] {:transformations txs}) data-kw)]
      (is (= 2 (count dsvs)))
      (is (= [(last txs) (first txs)] (dutils/unify-transformation-history dsvs))))))





