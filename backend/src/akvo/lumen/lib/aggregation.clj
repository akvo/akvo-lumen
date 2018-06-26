(ns akvo.lumen.lib.aggregation
  (:require [akvo.lumen.lib :as lib]
            [akvo.lumen.lib.aggregation.pie :as pie]
            [akvo.lumen.lib.aggregation.line :as line]
            [akvo.lumen.lib.aggregation.bar :as bar]
            [akvo.lumen.lib.aggregation.pivot :as pivot]
            [akvo.lumen.lib.aggregation.scatter :as scatter]
            [akvo.lumen.specs.db :as db.s]
            [akvo.lumen.specs.dataset :as dataset.s]
            [clojure.java.jdbc :as jdbc]
            [clojure.walk :as w]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")

(defmulti query*
  (fn [{:keys [::db.s/tenant-connection ::dataset.s/dataset ::visualisation-type query]}]
    visualisation-type))

(defmethod query* :default
  [{:keys [::db.s/tenant-connection ::dataset.s/dataset ::visualisation-type query]}]
  (lib/bad-request {"message" "Unsupported visualisation type"
                    "visualisationType" visualisation-type
                    "query" query}))

(defn query [tenant-conn dataset-id visualisation-type query]
  (jdbc/with-db-transaction [tenant-tx-conn tenant-conn {:read-only? true}]
    (if-let [dataset (dataset-by-id tenant-tx-conn {:id dataset-id})]
      (try
        (query* {::db.s/tenant-connection tenant-tx-conn
                 ::dataset.s/dataset (w/keywordize-keys dataset)
                 ::visualisation-type visualisation-type
                 :query (w/keywordize-keys query)})
        (catch clojure.lang.ExceptionInfo e
          (lib/bad-request (merge {:message (.getMessage e)}
                                  (ex-data e)))))
      (lib/not-found {"datasetId" dataset-id}))))

(defmethod query* "pivot"
  [{:keys [::db.s/tenant-connection ::dataset.s/dataset ::visualisation-type query]}]
  (pivot/query tenant-connection dataset query))

(defmethod query* "pie"
  [{:keys [::db.s/tenant-connection ::dataset.s/dataset ::visualisation-type query]}]
  (pie/query tenant-connection dataset query))

(defmethod query* "line"
  [{:keys [::db.s/tenant-connection ::db.s/dataset ::visualisation-type query]}]
  (line/query tenant-connection dataset query))

(defmethod query* "bar"
  [{:keys [::db.s/tenant-connection ::db.s/dataset ::visualisation-type query]}]
  (bar/query tenant-connection dataset query))

(defmethod query* "scatter"
  [{:keys [::db.s/tenant-connection ::db.s/dataset ::visualisation-type query]}]
  (scatter/query tenant-connection dataset query))

(defmethod query* "donut"
  [{:keys [::db.s/tenant-connection ::dataset.s/dataset ::visualisation-type query]}]
  (pie/query tenant-connection dataset query))
