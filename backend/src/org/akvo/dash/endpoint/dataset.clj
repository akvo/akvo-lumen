(ns org.akvo.dash.endpoint.dataset
  "Dataset..."
  (:require
   [clojure.java.jdbc :as jdbc]
   [clojure.data.csv :as csv]
   [cheshire.core :as json]
   [clj-http.client :as client]
   [clojure.pprint :refer [pprint]]
   [compojure.core :refer :all]
   [hugsql.core :as hugsql]
   [immutant.scheduling :as scheduling]
   [org.akvo.dash.component.tenants :refer [connection]]
   [org.akvo.dash.endpoint.util :refer [rr squuid str->uuid]]
   [org.akvo.dash.transformation :as t]
   ;; [org.akvo.dash.import :as import]
   [pandect.algo.sha1 :refer [sha1]]
   [clojure.java.jdbc :as jdbc]
   [ring.util.io :refer [string-input-stream]]))


(hugsql/def-db-fns "org/akvo/dash/endpoint/dataset.sql")


(defn do-import
  [db {:keys [:spec] :as datasource} {:keys [:id] :as dataset}]
  (try
    (let [{:strs [kind url]} spec]
      (try
        (update-dataset-data db {:id     (str id)
                                 :d      (-> (client/get url)
                                             :body
                                             csv/read-csv
                                             t/parse-csv-with-headers
                                             json/encode)
                                 :status "OK"})
        (catch Exception e
          (update-dataset-data db
                               {:id     (str id)
                                :d      (json/encode "")
                                :status "FAILURE"}))))
    (catch Exception e
      (pprint e)
      (pprint (.getNextException e)))))


(defn handle-datasets-POST!
  ""
  [{:keys [:body :tenant-label] :as request} db]
  (let [datasource {:id   (squuid)
                    :spec (get body "source")}
        dataset    {:id         (squuid)
                    :name       (get body "name")
                    :datasource (:id datasource)
                    :author     (json/encode {:user "Bob"})}
        resp       (jdbc/with-db-transaction [tx db]
                     {:datasource (insert-datasource tx datasource)
                      :dataset    (insert-dataset tx dataset)})]
    (scheduling/schedule #(do-import db ;; We need to pass db / tenenat ref
                                     (-> resp :datasource first)
                                     (-> resp :dataset first)))
    (rr (select-keys (-> resp :dataset first)
                     [:id :name :status :created :modified]))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;
;;;  Endpoint spec

(defn endpoint
  [{lord :lord :as config}]

  (context "/datasets" []

    (GET "/" []
      (fn [{label :tenant-label :as request}]
        (pprint request)
        (rr (all-datasets (connection lord label)))))

    (POST "/" []
      (fn [{label :tenant-label :as request}]
        (try
          (handle-datasets-POST! request
                                 (connection lord label))
          (catch Exception e
            (pprint e)
            (pprint (.getNextExcpetion e))
            (rr {:error  "Could not complete upload."
                 :status "FAILED"})))))


    (context "/:id" [id]

      (GET "/" []
        (fn [{label :tenant-label}]
          (let [{:keys [:id :d :name :status]} (dataset-by-id
                                                (connection lord label)
                                                {:id id})
                resp                           {"id"     id
                                                "name"   name
                                                "status" status}]
            (rr (if d
                  (assoc resp :columns d)
                  resp))))))))


#_(defn endpoint
  "/datasets

  / GET
  Return the dataset collection.

  / POST
  Creates a dataset.

  /:id GET
  Returns single dataset

  ...
  "
  [{{db :spec} :db}]

  (context "/datasets" []

    (GET "/" []
      (rr (dataset-coll db)))

    (POST "/" []
      (fn [req]
        (try
          (let [datasource     {:id   (squuid)
                                :kind (get-in req [:body "source" "kind"]) ;;?
                                :spec (get-in req [:body "source"])}
                dataset        {:id           (squuid)
                                :dataset_name (get-in req [:body "name"])
                                :datasource   (:id datasource)}
                dataset_meta   {:id           (squuid)
                                :dataset_name (get-in req [:body "name"])
                                :dataset      (:id dataset)}
                import         {:datasource (:id datasource)}
                transformation {:id      (squuid)
                                :dataset (:id dataset)
                                :fns     {:fns []}}
                res            (clojure.java.jdbc/with-db-transaction [tx db]
                                 {:s   (insert-datasource tx datasource)
                                  :ds  (insert-dataset tx dataset)
                                  :dsm (insert-dataset_meta tx dataset_meta)
                                  :t   (insert-transformation tx transformation)
                                  :i   (insert-import tx import)})
                resp           {"id"   (:id dataset)
                                "name" (:dataset_name dataset_meta)}]
            (if (= "DATA_FILE" (get-in datasource [:spec "kind"]))
              (do
                (import/do-import db
                                  datasource
                                  (-> res :i :id))
                (rr (assoc resp "status" "OK")))
              (do
                (scheduling/schedule #(import/job db
                                                  (-> res :i :id)))
                (rr (assoc resp "status" "PENDING")))))
          (catch Exception e
            (rr {:error  "Could not complete upload"
                 :status "FAILED"})))))


    (context "/:id" [id]

      (GET "/" []
        (let [r (dataset-by-id db
                               {:id (str->uuid id)})]
          (if (nil? r)
            (rr "404 Not Found"
                {:status  404
                 :headers {"content-type" "text"}})
            (rr
             (let [k        [:id :datasource :name :status :created :modified
                             :transformations]
                   resp-map (select-keys r k)]
               (condp = (:status r)
                 "OK"      (assoc resp-map
                                  :columns (json/parse-string
                                            (slurp (get-in r [:noble "noble"]))))
                 "FAILURE" (assoc resp-map
                                  :reason
                                  "Could not find dataset on remote server (404)")
                 resp-map)))))) ;; "PENDING" do nothing

      (PUT "/" []
        (fn [req]
          (insert-dataset_meta db
                               {:id           (squuid)
                                :dataset      (str->uuid id)
                                :dataset_name (get-in req [:body "name"])})
          (rr "\"OK\"")))

      ;; ## DELETE
      ;; Do we allow delete? Visualisations & in the longer run Dashboards
      ;; do rely on them being present. One could imagine at least 3
      ;; a: Don't allow deletion
      ;;    This seems to hinder creativity.
      ;; b: Archive
      ;;    Do not allow deletion of dataset but a way to archive them from your
      ;;    Dashboards main area. Problems with keeping track of stuff?
      ;; c: Cascading
      ;;    Do not allow delete where there are anything using the dataset.
      ;;    This does however create "issues" when we reference datasets in
      ;;    jsonb blobs like in visualistion spec. Should we query all jsonb
      ;;    specs for a possible match on dataset? - seems slow
      ;; (DELETE "/" []
      ;;   (fn [req] (rr "OK")))
      )))
