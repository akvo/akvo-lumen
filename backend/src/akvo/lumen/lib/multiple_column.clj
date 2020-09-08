(ns akvo.lumen.lib.multiple-column
  (:require [akvo.lumen.component.caddisfly :as c.caddisfly]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.postgres :as postgres]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [ring.util.response :refer [response not-found]]))

(defn adapt-schema [schema]
  (-> (select-keys schema [:hasImage])
      (assoc :columns (map (fn [r]
                             {:id   (:id r)
                              :name (format "%s (%s)" (:name r) (:unit r))
                              :type "text" ;; TODO will be improved after design discussions
                              }) (:results schema)))))

(defn- extract
  [caddisfly id]
  (when id
    (when-let [schema (c.caddisfly/get-schema caddisfly id)]
      (log/error :id id :schema schema)
      (adapt-schema schema))))

(def geo-shape-columns [{:id 1 :name "length" :type "number"}
                        {:id 2 :name "pointCount" :type "number"}
                        {:id 3 :name "area" :type "number"}])

(defn details
  "depending of type of multiple columns we dispatch to different logic impls"
  [{:keys [caddisfly] :as deps} multipleType multipleId]
  (log/debug ::all :multipleType multipleType :multipleId multipleId)
  (condp = multipleType
    "caddisfly" (if-let [res (extract caddisfly multipleId)]
                  (response res)
                  (not-found {:message "caddisfly id not found"
                              :multipleId multipleId}))
    "geo-shape-features" (response {:hasImage false
                                    :columns geo-shape-columns})
    (not-found {:type multipleType})))

(defn add-name-to-new-columns
  [current-columns columns-to-extract]
  (let [next-column-index (engine/next-column-index current-columns)
        indexes (map engine/derivation-column-name (iterate inc next-column-index))]
    (map #(assoc % :columnName %2 :id %2) columns-to-extract indexes)))

(defn multiple-cell-value
  "get json parsed value from cell row"
  [row column-name]
  (json/parse-string ((keyword column-name) row) keyword))

(defn update-row [conn table-name row-id vals-map default-null-value]
  (let [r (string/join "," (doall (map (fn [[k v]]
                                         (str (name k) "=" (if v
                                                             (if (string? v)
                                                               (postgres/adapt-string-value v)
                                                               v)
                                                             default-null-value))) vals-map)))
        sql (str  "update " table-name " SET "  r " where rnum=" row-id)]
    (log/debug :sql sql)
    (when (seq vals-map)
     (jdbc/execute! conn sql))))
