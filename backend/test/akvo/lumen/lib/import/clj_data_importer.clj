(ns akvo.lumen.lib.import.clj-data-importer
  (:require [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.protocols :as p]
            [robert.hooke :refer (add-hook) :as r]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib.import :as l.import]
            [clojure.tools.logging :as log]))

(defn new-insert-data-source
  [f tenant-conn data-source-id data-source]
  (log/info "hooking l.import/insert-data-source-db")
  (f tenant-conn data-source-id (-> data-source (update-in ["source"] dissoc "data"))))

(r/clear-hooks #'l.import/insert-data-source-db)
(r/add-hook #'l.import/insert-data-source-db #'new-insert-data-source)

(defn data-records [{:keys [columns rows]}]
  (for [row rows]
    (apply merge
           (map (fn [{:keys [id type]} {:keys [value]}]
                  {id value})
                columns
                row))))

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
    (clj-data-importer (get spec "data") headers? guess-types?)))
