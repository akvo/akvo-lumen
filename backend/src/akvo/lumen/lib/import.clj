(ns akvo.lumen.lib.import
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.db.job-execution :as db.job-execution]
            [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.db.dataset-version :as db.dataset-version]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.csv]
            [akvo.lumen.lib.env :as env]
            [akvo.lumen.lib.import.flow]
            [akvo.lumen.lib.import.csv]
            [akvo.lumen.lib.raster]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(defn- insert-dataset [conn dataset-id {:keys [spec-name spec-description]} claims]
  (db.dataset/insert-dataset conn {:id dataset-id
                                   :title spec-name ;; TODO Consistent naming. Change on client side?
                                   :description spec-description
                                   :author claims}))

(defn- update-job-execution [conn job-execution-id dataset-id]
  (db.job-execution/update-job-execution conn {:id             job-execution-id
                                               :status         "OK"
                                               :dataset-id     dataset-id}))

(defn- new-dataset-version [conn dataset-id job-execution-id data-source-id table-name columns {:strs [rqg rqg-dsv]}]
  (let [imported-table-name (util/gen-table-name "imported")]
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
                                                (let [column-def {:columnName id
                                                                  :direction nil
                                                                  :hidden false
                                                                  :key (boolean key)
                                                                  :multipleId multipleId
                                                                  :multipleType multipleType
                                                                  :groupName groupName
                                                                  :groupId groupId
                                                                  :sort nil
                                                                  :title (string/trim title)
                                                                  :type type}]
                                                  (if rqg
                                                    (assoc column-def :ns ns :repeatable (= groupId ns))
                                                    column-def)))
                                              columns)
                               :transformations []})))

(defn- failed-execution [conn job-execution-id reason table-name]
  (db.job-execution/update-failed-job-execution conn {:id job-execution-id
                                     :reason [reason]})
  (db.transformation/drop-table conn {:table-name table-name}))

(defn- ns-tables-cols* [columns rqg-dsv]
  (if rqg-dsv
    (let [columns        (map  (fn [c] (update c :ns (fn [ns] (or ns "main")))) columns)
          ns-table-names (reduce #(assoc % %2 {:table-name (util/gen-table-name "ds")}) {} (distinct (map :ns columns)))]
      (reduce (fn [c [k cols]] (assoc-in c [k :cols] cols)) ns-table-names #(group-by :ns columns)))
    {"main" {:table-name (util/gen-table-name "ds") :cols "columns"}}))

(comment
  "to test"
  (reduce (fn [c [k cols]] (assoc-in c [k :colums] cols)) {:a {:table-name "x"}
                                                          :b {:table-name "y"}}
          {:a [1 2 3] :b [4 5 6]})

  (doseq [[ns* {:keys [table-name columns]}] {:a {:table-name "x", :columns [1 2 3]},
                                              :b {:table-name "y", :columns [4 5 6]}}]
    (println ns* table-name columns)))

(defn- execute
  "Import runs within a future and since this is not taking part of ring
  request / response cycle we need to make sure to capture errors."
  [conn import-config error-tracker job-execution-id data-source-id claims spec]
  (future
    (let [{:strs [rqg rqg-dsv] :as environment} (env/all conn)
          dataset-id (util/squuid)
          dataset-spec {:spec-name        (get spec "name")
                        :spec-description (get spec "description" "")}]
      (try
        (with-open [importer (common/dataset-importer (get spec "source")
                                                      (assoc import-config :environment environment))]
          (let [ns-tables-cols (ns-tables-cols* (p/columns importer) rqg-dsv)]
            (doseq [[ns* {:keys [table-name cols]}] ns-tables-cols]
              ;; todo foreign references????
              (postgres/create-dataset-table conn (:table-name (get ns-tables-cols ns*)) cols))
            (doseq [record-groups (take common/rows-limit (p/records importer))]
              (doseq [record record-groups]
                (jdbc/insert! conn (:table-name (get ns-tables-cols (:ns (meta record) "main")))
                              (postgres/coerce-to-sql record))))
            (insert-dataset conn dataset-id dataset-spec claims)
            (doseq [[ns* {:keys [table-name cols]}] ns-tables-cols]
              (new-dataset-version conn job-execution-id data-source-id table-name cols environment))
            (update-job-execution conn job-execution-id dataset-id)))
        (catch Throwable e
          ;; TODO :: adapt
          (failed-execution conn job-execution-id (.getMessage e) "TODO: table-name(s)")
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
