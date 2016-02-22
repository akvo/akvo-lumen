(ns org.akvo.dash.endpoint.dataset
  "Dataset..."
  (:require
   [cheshire.core :as json]
   [clojure.pprint :refer [pprint]]
   [compojure.core :refer :all]
   [hugsql.core :as hugsql]
   [immutant.scheduling :as scheduling]
   [org.akvo.dash.endpoint.util :as u]
   [org.akvo.dash.endpoint.util :refer [rr]]
   [org.akvo.dash.import :as import]
   [pandect.algo.sha1 :refer [sha1]]
   [ring.util.io :refer [string-input-stream]]))


(hugsql/def-db-fns "org/akvo/dash/endpoint/dataset.sql")


(defn str->uuid ;; unnecessary?
  "Converts a string to a UUID.
  This will thrown on invalid uuid!"
  [s]
  (java.util.UUID/fromString s))


(defn endpoint
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
        ;; This needs to be reviwed once we get file upload. Not sure how that
        ;; will work do we have everying in one request? Does body include both
        ;; dataset info as name and the file?
        (let [datasource     {:id   (u/squuid)
                              :kind (get-in req [:body "source" "kind"])
                              :spec (get-in req [:body "source"])}
              dataset        {:id             (u/squuid)
                              :dataset_name   (get-in req [:body "name"])
                              :datasource     (:id datasource)}
              dataset_meta   {:id           (u/squuid)
                              :dataset_name (get-in req [:body "name"])
                              :dataset      (:id dataset)}
              import         {:datasource (:id datasource)}
              transformation {:id      (u/squuid)
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

          (if (= "FILE" (:kind datasource))
            (let [filename "org.akvo.dash.test/people.csv"
                  data     (slurp (clojure.java.io/resource filename))]
              (import/handle-file-upload db
                                         {:file-name filename
                                          :data      data}
                                         (-> res :i :id))
              (rr (assoc resp "status" "OK")))
            (do
              (scheduling/schedule #(import/job db
                                                (-> res :i :id)))
              (rr (assoc resp "status" "PENDING") ))))))


    (context "/:id" [id]

      (GET "/" []
        (let [r (dataset-by-id db
                               {:id (str->uuid id)})]
          (if (nil? r)
            (rr "404 Not Found"
                {:status  404
                 :headers {"content-type" "text"}})
            (rr
             (let [resp-map (select-keys r [:id :name :status])]
               (condp = (:status r)
                 "OK"      (assoc resp-map
                                  :columns (json/parse-string
                                            (slurp (-> r :noble :noble))))
                 "FAILURE" (assoc resp-map
                                  :reason
                                  "Could not find dataset on remote server (404)")
                 resp-map))))))))) ;; "PENDING" do nothing
