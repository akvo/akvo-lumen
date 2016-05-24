(ns org.akvo.dash.endpoint.dataset
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.string :as str]
            [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [org.akvo.dash.import :as import]
            [ring.util.response :refer (response not-found)]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/dataset.sql")

(defn select-data-sql [table-name columns]
  (let [column-names (map #(get % "columnName") columns)]
    (format "SELECT %s FROM %s"
            (str/join "," column-names)
            table-name)))

(defn find-dataset [conn id]
  (when-let [dataset (dataset-by-id conn {:id id})]
    (let [columns (remove #(get % "hidden") (:columns dataset))
          data (rest (jdbc/query conn
                                 [(select-data-sql (:table-name dataset) columns)]
                                 :as-arrays? true))
          columns-with-data (map (fn [column values]
                                   (assoc column :values values))
                                 columns
                                 (apply map vector data))]
      {:id id
       :name (:title dataset)
       :modified (:modified dataset)
       :created (:created dataset)
       :status "OK"
       :columns columns-with-data})))


(defn endpoint [{:keys [tenant-manager config]}]
  (context "/api/datasets" {:keys [params tenant] :as request}

    (GET "/" []
      (response (all-datasets (connection tenant-manager tenant))))

    (POST "/" {:keys [tenant body jwt-claims] :as request}
      (let [tenant-conn (connection tenant-manager tenant)]
        (import/handle-import-request tenant-conn config jwt-claims body)))

    (context "/:id" [id]

      (GET "/" []
        (let [dataset (find-dataset (connection tenant-manager tenant) id)]
          (if dataset
            (response dataset)
            (not-found {:id id}))))

      (DELETE "/" []
        (delete-dataset-by-id (connection tenant-manager tenant) {:id id})
        (response {:id id}))

      (context "/transformations" []

        (GET "/" []
          (response {:fns []}))))))
