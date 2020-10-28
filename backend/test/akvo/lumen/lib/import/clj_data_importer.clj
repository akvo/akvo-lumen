(ns akvo.lumen.lib.import.clj-data-importer
  (:require [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.protocols :as p]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib.import :as l.import]
            [clojure.tools.logging :as log]))


(defn data-records [{:keys [columns rows]}]
  (for [row rows]
    [(apply merge
             (map (fn [{:keys [id type]} {:keys [value]}]
                    {id value})
                  columns
                  row))]))

(defn clj-data-importer [{:keys [columns rows] :as data} headers? guess-types?]
  (reify
    p/DatasetImporter
    (columns [this] columns)
    (records [this]
      (data-records data))
    java.io.Closeable
    (close [this])))

(defmethod common/dataset-importer "clj"
  [spec _]
  (let [headers? (boolean (get spec "hasColumnHeaders"))
        guess-types? (-> (get spec "guessColumnTypes") false? not)]
    (clj-data-importer (:data (meta spec)) headers? guess-types?)))

(defmethod common/datagroups-importer "clj"
  [spec data]
  (let [base-importer (common/dataset-importer spec data)]
    (reify
      p/DatasetImporter
      (columns [this]
        (p/columns base-importer))
      (records [this]
        (->> (p/records base-importer)
             (map (partial hash-map "main"))))
      java.io.Closeable
      (close [this]
        (.close base-importer)))))

(defmethod common/dataset-importer "clj-flow"
  [spec _]
  (let [{:keys [columns-v3 records-v3] :as data} (:data (meta spec))]
    (reify
      p/DatasetImporter
      (columns [this] columns-v3)
      (records [this] records-v3)
      java.io.Closeable
      (close [this]))))

(defmethod common/datagroups-importer "clj-flow"
  [spec data]
  (let [{:keys [columns-v4 records-v4] :as data} (:data (meta spec))]
    (reify
      p/DatasetImporter
      (columns [this] columns-v4)
      (records [this] records-v4)
      java.io.Closeable
      (close [this]))))


