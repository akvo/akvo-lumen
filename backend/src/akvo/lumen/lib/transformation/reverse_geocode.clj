(ns akvo.lumen.lib.transformation.reverse-geocode
  (:require [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.db.transformation.engine :as db.tx.engine]
            [akvo.lumen.db.transformation.reverse-geocode :as db.tx.reverse-geocode]
            [akvo.lumen.util :as util]
            [akvo.lumen.lib.dataset.utils :as dataset.utils]
            [clojure.java.jdbc :as jdbc]
            [clojure.walk :as w]))

(defmethod engine/valid? "core/reverse-geocode"
  [op-spec]
  (let [{:strs [target source]} (get op-spec "args")]
    (and (string? (get target "title"))
         (util/valid-column-name? (get target "geopointColumn"))
         (util/valid-dataset-id? (get source "datasetId"))
         (util/valid-column-name? (get source "geoshapeColumn"))
         (util/valid-column-name? (get source "mergeColumn")))))

(defn table-qualify [table-name column-name]
  (str table-name "." column-name))

(defn source-table-name [conn {:strs [datasetId mergeColumn geoshapeColumn]}]
  (let [dsvs (db.transformation/latest-dataset-version-by-dataset-id conn {:dataset-id datasetId})
        columns (w/keywordize-keys (reduce into [] (map :columns dsvs)))
        namespaces (set (engine/namespaces columns [mergeColumn geoshapeColumn]))]
    (if-let [namespace (and (= 1 (count namespaces)) (first namespaces))]
      (:table-name (first (filter #(= namespace (:namespace %)) dsvs)))
      (throw "Reverse-geocode source columns should belong to the same data-group"))))

(defmethod engine/apply-operation "core/reverse-geocode"
  [{:keys [tenant-conn]} dataset-versions {:strs [args] :as op-spec}]
  (let [namespace (engine/get-namespace op-spec)
        dsv (get dataset-versions namespace)
        columns (:columns dsv)
        all-dsv-columns (reduce #(into % (:columns %2)) [] (vals dataset-versions))
        column-name (engine/next-column-name all-dsv-columns)
        table-name (:table-name dsv)
        {:strs [target source]} args
        geopointColumn (get target "geopointColumn")
        {:strs [mergeColumn geoshapeColumn]} source        
        source-table-name (source-table-name tenant-conn source)
        new-columns (conj columns
                          {"title" (get target "title")
                           "type" "text"
                           "sort" nil
                           "hidden" false
                           "namespace" namespace
                           "direction" nil
                           "columnName" column-name})]
    (if-let [response-error (engine/column-title-error? (get target "title") columns)]
      response-error
      (do
        (db.tx.engine/add-column tenant-conn {:column-type "text"
                                              :new-column-name column-name
                                              :table-name table-name})
        (db.tx.reverse-geocode/reverse-geocode tenant-conn {:point-column (table-qualify table-name geopointColumn)
                                                            :shape-column (table-qualify source-table-name geoshapeColumn)
                                                            :source-column-name (table-qualify source-table-name mergeColumn)
                                                            :source-table-name source-table-name
                                                            :target-column-name column-name
                                                            :target-table-name table-name})
        {:success? true
         :execution-log ["Geocoded"]
         :dataset-versions (vals (-> dataset-versions
                                     (assoc-in [namespace :columns] new-columns)
                                     (update-in [namespace :transformations]
                                                engine/update-dsv-txs op-spec (:columns dsv) new-columns)))}))))

(defmethod engine/columns-used "core/reverse-geocode"
  [applied-transformation columns]
  [(-> applied-transformation :args :target :geopointColumn)])
