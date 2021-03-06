(ns akvo.lumen.lib.import
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.db.job-execution :as db.job-execution]
            [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.db.dataset-version :as db.dataset-version]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.env :as env]
            [akvo.lumen.lib.import.flow :as i.flow]
            [akvo.lumen.lib.import.csv]
            [akvo.lumen.lib.import.data-groups :as i.data-groups]
            [akvo.lumen.lib.raster]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(def ^:dynamic *data-groups-future* true)

(defn- successful-execution [conn job-execution-id data-source-id dataset-id table-name columns {:keys [spec-name spec-description]} claims]
  (let [imported-table-name (util/gen-table-name "imported")]
    (db.dataset/insert-dataset conn {:id dataset-id
                          :title spec-name ;; TODO Consistent naming. Change on client side?
                          :description spec-description
                          :author claims})
    (db.job-execution/clone-data-table conn
                      {:from-table table-name
                       :to-table imported-table-name}
                      {}
                      {:transaction? false})
    (db.dataset-version/new-dataset-version conn {:id (util/squuid)
                               :dataset-id dataset-id
                               :job-execution-id job-execution-id
                               :table-name table-name
                               :imported-table-name imported-table-name
                               :version 1
                               :columns (mapv (fn [{:keys [title id type key multipleType multipleId groupName groupId ns]}]
                                                {:columnName id
                                                 :direction nil
                                                 :hidden false
                                                 :key (boolean key)
                                                 :multipleId multipleId
                                                 :multipleType multipleType
                                                 :groupName groupName
                                                 :groupId groupId
                                                 :sort nil
                                                 :title (string/trim title)
                                                 :type type})
                                              columns)
                               :transformations []})))

(defn- failed-execution [conn job-execution-id reason table-name]
  (db.job-execution/update-failed-job-execution conn {:id job-execution-id
                                     :reason [reason]})
  (db.transformation/drop-table conn {:table-name table-name}))

(defn- execute
  "Import runs within a future and since this is not taking part of ring
  request / response cycle we need to make sure to capture errors."
  [conn import-config error-tracker job-execution-id data-source-id claims spec]
  (future
    (let [table-name (util/gen-table-name "ds")]
      (try
        (with-open [importer (common/dataset-importer (get spec "source")
                                                      (assoc import-config :environment (env/all conn)))]
          (let [dataset-id (str (util/squuid))
                columns (p/columns importer)]
            (postgres/create-dataset-table conn table-name columns)
            (doseq [record (map (comp postgres/coerce-to-sql common/extract-first-and-merge)
                                (take common/rows-limit (p/records importer)))]
              (jdbc/insert! conn table-name record))
            (successful-execution conn job-execution-id data-source-id dataset-id table-name columns {:spec-name (get spec "name")
                                                                                                      :spec-description (get spec "description" "")} claims)
            (if *data-groups-future*
              (do
                (db.job-execution/update-job-execution conn {:id             job-execution-id
                                                             :status         "OK"
                                                             :dataset-id     dataset-id})
                (future
                  (try
                    (i.data-groups/execute conn job-execution-id data-source-id dataset-id claims spec import-config)
                    (catch Exception e (log/error e)))))
              (do
                (i.data-groups/execute conn job-execution-id data-source-id dataset-id claims spec import-config)
                (db.job-execution/update-job-execution conn {:id             job-execution-id
                                                             :status         "OK"
                                                             :dataset-id     dataset-id})))))
        (catch Throwable e
          (failed-execution conn job-execution-id (.getMessage e) table-name)
          (log/error e)
          (p/track error-tracker e)
          (throw e))))))

(defn handle [tenant-conn import-config error-tracker claims data-source]
  (let [data-source-id (str (util/squuid))
        job-execution-id (str (util/squuid))]
    (db.job-execution/insert-data-source tenant-conn {:id data-source-id
                                                      :spec (json/generate-string
                                                             (update data-source "source" dissoc "token"))})
    (db.job-execution/insert-job-execution tenant-conn {:id job-execution-id
                                                        :data-source-id data-source-id})
    (execute tenant-conn import-config error-tracker job-execution-id data-source-id claims data-source)
    (lib/ok {"importId" job-execution-id
             "kind" (get-in data-source ["source" "kind"])})))
