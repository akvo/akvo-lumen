(ns akvo.lumen.test-utils
  (:require [akvo.lumen.component.tenant-manager :refer [pool]]
            [akvo.lumen.import :refer [do-import]]
            [akvo.lumen.util :refer [squuid]]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/job-execution.sql")


(def seed-data
  (->> "test-seed.edn"
       io/resource
       slurp
       edn/read-string))

(def test-tenant
  (first (filter #(= "t1" (:label %))
                 (:tenants seed-data))))

(let [cache (atom {:connection nil})]
  (defn test-tenant-conn [tenant]
    (let [connection (:connection @cache)]
      (if-not (nil? connection)
        connection
        (:connection (swap! cache assoc :connection (pool tenant)))))))


#_(let [p (atom {:conn nil})]
    (defn test-tenant-conn [tenant]
      (when (nil? (:conn @p))
        (swap! p assoc :conn (pool tenant))
        )
      (pool tenant)))

(defn import-file-2
  "Import a file and return the dataset-id"
  [tenant-conn file {:keys [dataset-name has-column-headers?]}]
  (let [data-source-id (str (squuid))
        job-id (str (squuid))
        data-source-spec {"name" (or dataset-name file)
                          "source" {"path" (.getAbsolutePath (io/file (io/resource file)))
                                    "kind" "DATA_FILE"
                                    "fileName" (or dataset-name file)
                                    "hasColumnHeaders" (boolean has-column-headers?)}}]
    (insert-data-source tenant-conn {:id data-source-id :spec data-source-spec})
    (insert-job-execution tenant-conn {:id job-id :data-source-id data-source-id})
    (do-import tenant-conn {:file-upload-path "/tmp/akvo/dash"} job-id)
    (:dataset_id (dataset-id-by-job-execution-id tenant-conn {:id job-id}))))
