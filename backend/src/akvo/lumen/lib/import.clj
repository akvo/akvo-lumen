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

(defn- successful-execution [conn job-execution-id data-source-id columns-by-ns {:keys [spec-name spec-description]} claims]
  (doseq [[_ {:keys [table-name columns]}] columns-by-ns]
    (let [dataset-id (util/squuid)
          imported-table-name (util/gen-table-name "imported")]
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
                                                    :columns (mapv (fn [{:keys [metadata title id type key multipleType multipleId groupName groupId]}]
                                                                     {:columnName id
                                                                      :direction nil
                                                                      :hidden false
                                                                      :key (boolean key)
                                                                      :multipleId multipleId
                                                                      :multipleType multipleType
                                                                      :metadata metadata
                                                                      :groupName groupName
                                                                      :groupId groupId
                                                                      :sort nil
                                                                      :title (string/trim title)
                                                                      :type type})
                                                                   columns)
                                                    :transformations []})
      (db.job-execution/update-job-execution conn {:id         job-execution-id
                                                   :status     "OK"
                                                   :dataset-id dataset-id}))))

(defn- failed-execution [conn job-execution-id reason]
  (db.job-execution/update-failed-job-execution conn {:id job-execution-id
                                                      :reason [reason]}))

(defn- group-columns-by-ns
  [columns]
  (reduce-kv (fn [m k v]
               (-> m
                   (assoc-in [k :columns] v)
                   (assoc-in [k :table-name] (util/gen-table-name "ds"))))
             {}
             (group-by :ns columns)))

(defn- get-table
  [columns ns]
  (get-in columns [ns :table-name]))

(defn- group-record-by-table
  [columns record]
  (reduce-kv (fn [m k v]
               (let [table (get-table columns k)
                     current (into {} (map (fn [[k v]]
                                             [(keyword (name k)) v])) v)]
                 (assoc m table current)))
             {}
             (group-by (comp namespace first) (seq record))))

(comment

  (group-columns-by-ns [{:id :a :ns "main"}
                        {:id :b :ns "main"}
                        {:id :c :ns "main"}])
;; => {"main"
;;     {:columns
;;      [{:id :a, :ns "main"} {:id :b, :ns "main"} {:id :c, :ns "main"}],
;;      :table-name "ds_fb67509f_50ae_4e84_a1ae_b1752e6fd6dc"}}

  (let [columns [{:id :a :ns "main"}
                 {:id :b :ns "main"}
                 {:id :c :ns "main"}
                 {:id :b :ns "foo"}]
        records [{:main/a "1"
                  :main/b true
                  :main/c 42
                  :foo/b 60}
                 {:main/a "3"
                  :main/b false
                  :main/c 4
                  :foo/b 0}]
        columns-by-ns (group-columns-by-ns columns)]
    (map #(group-record-by-table columns-by-ns %)
         (map postgres/coerce-to-sql (take common/rows-limit records))))

;; => ({"ds_301b937d_184b_4248_bb32_ee8d5396953e" {:a "1", :b true, :c 42},
;;      "ds_4cd1bc8d_0b1d_4f58_9a2a_932ae18ede53" {:b 60}}
;;     {"ds_301b937d_184b_4248_bb32_ee8d5396953e" {:a "3", :b false, :c 4},
;;      "ds_4cd1bc8d_0b1d_4f58_9a2a_932ae18ede53" {:b 0}})

    (let [columns [{:id :a :ns "main"}
                 {:id :b :ns "main"}
                 {:id :c :ns "main"}
                 {:id :b :ns "foo"}]
          columns-by-ns (group-columns-by-ns columns)]
      (doseq [[_ {:keys [table-name columns]}] columns-by-ns]
        (prn table-name columns)))


)

(defn- execute
  "Import runs within a future and since this is not taking part of ring
  request / response cycle we need to make sure to capture errors."
  [conn import-config error-tracker job-execution-id data-source-id claims spec]
  (future
    (let [table-name (util/gen-table-name "ds")]
      (try
        (with-open [importer (common/dataset-importer (get spec "source")
                                                      (assoc import-config :environment (env/all conn)))]
          (let [all-columns (p/columns importer)
                columns-by-ns (group-columns-by-ns all-columns)]
            (doseq [[_ {:keys [table-name columns]}] columns-by-ns]
              (postgres/create-dataset-table conn table-name columns))
            (doseq [table-name-record-col (map #(group-record-by-table columns-by-ns %)
                                               (map postgres/coerce-to-sql (take common/rows-limit (p/records importer))))]
              (doseq [[table-name record] table-name-record-col]
                (jdbc/insert! conn table-name record)))
            (successful-execution conn job-execution-id data-source-id columns-by-ns {:spec-name (get spec "name")
                                                                                      :spec-description (get spec "description" "")} claims)))
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
