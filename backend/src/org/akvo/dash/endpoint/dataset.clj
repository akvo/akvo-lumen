(ns org.akvo.dash.endpoint.dataset
  (:require [clojure.set :as set]
            [clojure.string :as str]
            [clojure.java.jdbc :as jdbc]
            [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [org.akvo.dash.import :as import]
            [ring.util.response :refer (response not-found)]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/dataset.sql")

(defn select-data-sql [table-name columns]
  (format "SELECT %s FROM %s"
          (str/join "," (map :column-name columns))
          table-name))

(defn find-dataset [conn id]
  (when-let [dataset (dataset-by-id conn {:id id})]
    (let [columns (sort-by :column-order (dataset-columns-by-dataset-id conn {:id id}))
          data (rest (jdbc/query conn [(select-data-sql (:table-name dataset) columns)] :as-arrays? true))
          columns-with-data (map (fn [column values]
                                   {:title (:title column)
                                    :type (:type column)
                                    :values values})
                                 columns
                                 (apply map vector data))]
      {:id id
       :name (:title dataset)
       :modified (:modified dataset)
       :created (:created dataset)
       :columns  columns-with-data})))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;
;;;  Endpoint spec

(defn endpoint [config]
  (fn [{tm :tenant-manager}]
    (context "/datasets" []
      (GET "/" []
        (fn [{tenant :tenant :as request}]
          (response (all-datasets (connection tm tenant)))))

      (POST "/" {:keys [tenant body] :as request}
        (let [tenant-conn (connection tm tenant)]
          (let [;; TODO accidentally introduced mismatch between what
                ;; the client sends and what the new import
                ;; expects. Should be resolved.
                data-source (assoc (set/rename-keys (get body "source") {"kind" "type"})
                                   "title" (get body "name"))
                data-source (if (or (= "DATA_FILE" (get data-source "type"))
                                    (= "LINK" (get data-source "type")))
                              (assoc data-source "type" "csv")
                              data-source)]
            (response (import/handle-import-request tenant-conn config data-source)))))

      (GET "/:id" {:keys [tenant params]}
        (let [tenant-conn (connection tm tenant)
              dataset (find-dataset tenant-conn (:id params))]
          (if dataset
            (response dataset)
            (not-found {:id (:id params)})))))))
