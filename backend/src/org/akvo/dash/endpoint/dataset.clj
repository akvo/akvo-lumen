(ns org.akvo.dash.endpoint.dataset
  "Dataset..."
  (:require
   [cheshire.core :as json]
   [clojure.pprint :refer [pprint]]
   [compojure.core :refer :all]
   [hugsql.core :as hugsql]
   [immutant.scheduling :as scheduling]
   [org.akvo.dash.endpoint.util :as u]
   [org.akvo.dash.import :as import]
   [pandect.algo.sha1 :refer [sha1]]
   [ring.util.io :refer [string-input-stream]]))


(defn str->uuid ;; unnecessary?
  "Converts a string to a UUID."
  [s]
  (java.util.UUID/fromString s))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; HUGSQL fns

(hugsql/def-db-fns "org/akvo/dash/endpoint/sql/datasource.sql")
(hugsql/def-db-fns "org/akvo/dash/endpoint/sql/import.sql")
(hugsql/def-db-fns "org/akvo/dash/endpoint/sql/dataview.sql")
(hugsql/def-db-fns "org/akvo/dash/endpoint/sql/transformation.sql")

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; API

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
      (u/fn->json-resp (all-datasets db)))

    ;; POST blindly expect LINK kind
    (POST "/" [req]
      (fn [req]
        (try
          (let [body              (json/parse-string (slurp (:body req))
                                                     true)
                dataset-name      (:name body)
                datasource-id     (u/squuid)
                dataview-id       (u/squuid)
                transformation-id (u/squuid)
                kind              (-> body :source :kind)
                ;; How to handle / structure spec needs some thought
                spec              {:url    (-> body :source :url)
                                   :update "NO"}
                r                 (clojure.java.jdbc/with-db-transaction [tx db]
                                    {:t (insert-transformation
                                         tx
                                         {:id  transformation-id
                                          :fns {:fns []}})
                                     :s (insert-datasource
                                         tx
                                         {:id   datasource-id
                                          :kind kind
                                          :spec spec})
                                     :v (insert-dataview
                                         tx
                                         {:id             dataview-id
                                          :dataset-name   dataset-name
                                          :datasource     datasource-id
                                          :transformation transformation-id})
                                     :i (insert-import
                                         tx
                                         {:datasource datasource-id})})]
            (scheduling/schedule
             #(import/job db {:import-id (-> r :i :id)}))

            {:status  200
             :headers {"content-type" "application/json"}
             :body    (json/generate-string {:name   dataset-name
                                             :id     dataview-id
                                             :status "PENDING"})})
          (catch Exception e
            ;; We should really log (warn)
            (pprint e)
            (pprint (.getNextException e))
            {:status  500 ;; ?
             :headers {"content-type" "text/plain"}
             :body    (str e (.getNextException e))}))))



    (context "/:id" [id]

      (GET "/" []

        (let [r (dataset-by-id db {:id (str->uuid id)})
              ;; Made error msg top level to show it's not implemented
              e "Could not find dataset on remote server (404)"]
          (if (nil? r)
            {:status  404
             :headers {"content-type" "text/plain"}
             :body    "404 Not Found"}
            (let [resp-map {:id     (str (:view_id r))
                            :status (:status r)
                            :name   (:dataset_name r)}
                  resp     (condp = (:status r)
                             "OK"      (assoc resp-map
                                              :columns
                                              (json/parse-string
                                               (slurp (-> r :noble :noble))))
                             "FAILURE" (assoc resp-map :reason e)
                             resp-map)]
              {:status  200
               :headers {"content-type" "application/json"}
               :body    (json/generate-string resp)})))))))
