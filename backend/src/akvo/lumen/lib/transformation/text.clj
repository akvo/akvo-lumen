(ns akvo.lumen.lib.transformation.text
  "Simple text transforms"
  (:require [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.util :as util]
            [clojure.tools.logging :as log]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/transformation/text.sql")

(defn- transform
  [tenant-conn table-name columns op-spec fn]
  (let [{column-name "columnName"} (engine/args op-spec)]
    (text-transform tenant-conn {:table-name table-name
                                 :column-name column-name
                                 :fn fn})
    {:success? true
     :execution-log [(format "Text transform %s on %s" fn column-name)]
     :columns columns}))

(defn valid? [op-spec]
  (util/valid-column-name? (get (engine/args op-spec) "columnName")))

(defmethod engine/valid? "core/trim" [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation "core/trim"
  [{:keys [tenant-conn]} table-name columns op-spec]
  (transform tenant-conn table-name columns op-spec "trim"))

(defmethod engine/valid? "core/to-lowercase" [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation "core/to-lowercase"
  [{:keys [tenant-conn]} table-name columns op-spec]
  (transform tenant-conn table-name columns op-spec "lower"))

(defmethod engine/valid? "core/to-uppercase" [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation "core/to-uppercase"
  [{:keys [tenant-conn]} table-name columns op-spec]
  (transform tenant-conn table-name columns op-spec "upper"))

(defmethod engine/valid? "core/to-titlecase" [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation "core/to-titlecase"
  [{:keys [tenant-conn]} table-name columns op-spec]
  (transform tenant-conn table-name columns op-spec "initcap"))

(defmethod engine/valid? "core/trim-doublespace" [op-spec]
  (valid? op-spec))

(defmethod engine/apply-operation "core/trim-doublespace"
  [{:keys [tenant-conn]} table-name columns op-spec]
  (let [{column-name "columnName"} (engine/args op-spec)]
    (trim-doublespace tenant-conn {:table-name table-name
                                   :column-name column-name})
    {:success? true
     :execution-log [(format "Text transform trim-doublespace on %s" column-name)]
     :columns columns})
  {:success? true
   :columns columns})
