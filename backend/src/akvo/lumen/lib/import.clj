(ns akvo.lumen.lib.import
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.csv]
            [akvo.lumen.lib.import.flow]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")
(hugsql/def-db-fns "akvo/lumen/lib/transformation.sql")

(defn- successful-import [conn job-execution-id table-name columns spec claims]
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
    (insert-dataset-version conn {:id (util/squuid)
                                  :dataset-id dataset-id
                                  :job-execution-id job-execution-id
                                  :table-name table-name
                                  :imported-table-name imported-table-name
                                  :version 1
                                  :columns (mapv (fn [{:keys [title id type key multiple-type multiple-id]}]
                                                   {:columnName (name id)
                                                    :direction nil
                                                    :hidden false
                                                    :key (boolean key)
                                                    :multipleId multiple-id
                                                    :multipleType multiple-type
                                                    :sort nil
                                                    :title (string/trim title)
                                                    :type (name type)})
                                                 columns)
                                  :transformations []})
    (update-successful-job-execution conn {:id job-execution-id})))

(defn- failed-import [conn job-execution-id reason table-name]
  (update-failed-job-execution conn {:id job-execution-id
                                     :reason [reason]})
  (drop-table conn {:table-name table-name}))

(defn do-import
  "Import runs within a future and since this is not taking part of ring
  request / response cycle we need to make sure to capture errors."
  [conn {:keys [sentry-backend-dsn] :as config} error-tracker job-execution-id claims]
  (future
    (let [table-name (util/gen-table-name "ds")]
      (try
        (let [spec (:spec (data-source-spec-by-job-execution-id conn {:job-execution-id job-execution-id}))]
          (with-open [importer (common/dataset-importer (get spec "source") config)]
            (let [columns (p/columns importer)]
              (common/create-dataset-table conn table-name columns)
              (doseq [record (map common/coerce-to-sql (p/records importer))]
                (jdbc/insert! conn table-name record))
              (successful-import conn job-execution-id table-name columns spec claims))))
        (catch Throwable e
          (failed-import conn job-execution-id (.getMessage e) table-name)
          (log/error e)
          (p/track error-tracker e)
          (throw e))))))

(defn handle-import-request [tenant-conn config error-tracker claims data-source]
  (let [data-source-id (str (util/squuid))
        job-execution-id (str (util/squuid))
        table-name (util/gen-table-name "ds")
        kind (get-in data-source ["source" "kind"])]
    (insert-data-source tenant-conn {:id data-source-id
                                     :spec (json/generate-string data-source)})
    (insert-job-execution tenant-conn {:id job-execution-id
                                       :data-source-id data-source-id})
    (do-import tenant-conn config error-tracker job-execution-id claims)
    (lib/ok {"importId" job-execution-id
             "kind" kind})))
