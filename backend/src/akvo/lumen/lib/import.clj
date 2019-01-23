(ns akvo.lumen.lib.import
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.csv]
            [akvo.lumen.lib.import.flow]
            [akvo.lumen.lib.import.csv]
            [akvo.lumen.lib.raster]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/lib/dataset_version.sql")
(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")

(defn- successful-execution [conn job-execution-id data-source-id table-name columns spec claims]
  (let [dataset-id (util/squuid)
        imported-table-name (util/gen-table-name "imported")]
    (insert-dataset conn {:id dataset-id
                          :title (get spec "name") ;; TODO Consistent naming. Change on client side?
                          :description (get spec "description" "")
                          :author claims})
    (clone-data-table conn
                      {:from-table table-name
                       :to-table imported-table-name}
                      {}
                      {:transaction? false})
    (new-dataset-version conn {:id (util/squuid)
                                  :dataset-id dataset-id
                                  :job-execution-id job-execution-id
                                  :table-name table-name
                                  :imported-table-name imported-table-name
                                  :version 1
                                  :columns (mapv (fn [{:keys [title id type key multipleType multipleId]}]
                                                   {:columnName (name id)
                                                    :direction nil
                                                    :hidden false
                                                    :key (boolean key)
                                                    :multipleId multipleId
                                                    :multipleType multipleType
                                                    :sort nil
                                                    :title (string/trim title)
                                                    :type (name type)})
                                                 columns)
                                  :transformations []})
    (update-job-execution conn {:id             job-execution-id
                                :status         "OK"
                                :dataset-id     dataset-id
                                :data-source-id data-source-id})))

(defn- failed-execution [conn job-execution-id reason table-name]
  (update-failed-job-execution conn {:id job-execution-id
                                     :reason [reason]})
  (drop-table conn {:table-name table-name}))

(defn- execute
  "Import runs within a future and since this is not taking part of ring
  request / response cycle we need to make sure to capture errors."
  [conn {:keys [sentry-backend-dsn] :as config} error-tracker job-execution-id data-source-id claims spec]
  (future
    (let [table-name (util/gen-table-name "ds")]
      (try
        (with-open [importer (common/dataset-importer (get spec "source") config)]
          (let [columns (p/columns importer)]
            (postgres/create-dataset-table conn table-name columns)
            (doseq [record (map postgres/coerce-to-sql (p/records importer))]
              (jdbc/insert! conn table-name record))
            (successful-execution conn job-execution-id  data-source-id table-name columns spec claims)))
        (catch Throwable e
          (failed-execution conn job-execution-id (.getMessage e) table-name)
          (log/error e)
          (p/track error-tracker e)
          (throw e))))))

(defn insert-data-source-db
  "not all kind of things in data-source could be jsonify properly,
  extracting here this functionality to be hookable in `dev` and `test`"
  [tenant-conn data-source-id data-source]
  (insert-data-source tenant-conn {:id data-source-id
                                   :spec (json/generate-string data-source)}))

(defn handle [tenant-conn config error-tracker claims data-source]
  (let [data-source-id (str (util/squuid))
        job-execution-id (str (util/squuid))]
    (insert-data-source-db tenant-conn data-source-id data-source)
    (insert-job-execution tenant-conn {:id job-execution-id
                                       :data-source-id data-source-id})
    (execute tenant-conn config error-tracker job-execution-id data-source-id claims data-source)
    (lib/ok {"importId" job-execution-id
             "kind" (get-in data-source ["source" "kind"])})))
