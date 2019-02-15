(ns akvo.lumen.specs.hooks
  "this namespace should dissapear soon, just adapts some chunks of data before conforming them"
  (:require [akvo.lumen.lib.import :as import]
            [clojure.walk :as walk]
            [akvo.lumen.util :refer [squuid] :as util]
            [akvo.lumen.specs]
            [akvo.lumen.specs.components]
            [akvo.lumen.specs.db]
            [akvo.lumen.specs.db.dataset-version]
            [akvo.lumen.specs.db.dataset-version.column]
            [akvo.lumen.specs.import]
            [akvo.lumen.specs.import.column]
            [akvo.lumen.specs.import.values]
            [akvo.lumen.specs.aggregation]
            [akvo.lumen.specs.dataset]
            [akvo.lumen.specs.postgres]
            [akvo.lumen.specs.transformation]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib.transformation.engine :refer (new-dataset-version)]
            [robert.hooke :refer (add-hook) :as r]))

(defn dataset-version-spec-adapter
  "provisional spec adapter function to be removed when specs work was finished"
  [dsv]
  (-> (walk/keywordize-keys dsv)
      (update :transformations
              (fn [txs]
                (mapv (fn [t]
                        (update t :changedColumns
                                (fn [cc]
                                  (reduce (fn [c [k v]] (assoc c (name k) v)) {} cc)))) txs)))))

(defn new-dataset-version-conform
  [f t d]
  (log/info :conforming :akvo.lumen.specs.transformation/next-dataset-version)
  (util/conform :akvo.lumen.specs.transformation/next-dataset-version d dataset-version-spec-adapter)
  (f t d))

(defn apply-hooks []
  (doseq [v [#'new-dataset-version #'import/new-dataset-version]]
    (r/clear-hooks v)
    (r/add-hook v #'new-dataset-version-conform)))
