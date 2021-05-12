(ns akvo.lumen.lib.data-groups-adapter
  (:require [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.lib.import.data-groups :as i.data-groups]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.db.job-execution :as db.job-execution]
            [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.db.dataset-version :as db.dataset-version]
            [akvo.lumen.db.data-source :as db.data-source]
            [akvo.lumen.db.data-group :as db.data-group]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.csv]
            [akvo.lumen.lib.env :as env]
            [akvo.lumen.lib.data-group :as lib.data-group]
            [akvo.lumen.lib.import.flow :as i.flow]
            [akvo.lumen.lib.import.csv]
            [akvo.lumen.lib.raster]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.walk :as w]
            [clojure.tools.logging :as log]))

(defn adapter [conn rows columns job-execution-id dataset-id claims]
  (let [_ (log/info :columns-dsv2 columns)
        {:keys [columns group-table-names]} (i.data-groups/adapt-columns columns)
        columns (if-let [instance_id (first (filter #(= "instance_id" (get % :columnName))columns))]
                  (reduce (fn [c groupId]
                            (conj c (assoc instance_id
                                           :groupId groupId
                                           :groupName groupId))
                            ) columns (disj (set (keys (group-by :groupId columns))) "metadata"))
                  columns)


        group-cols (group-by :groupId columns)
        ]
    (log/error :group-cols group-cols)
    (doseq [[groupId cols] group-cols]
      (postgres/create-dataset-table conn (get group-table-names groupId) cols))
    (doseq [response (take common/rows-limit rows)]
      (log/debug :response-dsv2 response )
      (doseq [[groupId iterations] response]
        (let [table-name (get group-table-names groupId)]
          (log/error :its iterations)
          (jdbc/insert-multi! conn table-name (mapv postgres/coerce-to-sql iterations))))) ;; perhaps don't need coercion (mapv postgres/coerce-to-sql iterations)
    (postgres/create-data-group-foreign-keys conn group-table-names)
    (i.data-groups/successful-execution conn job-execution-id dataset-id group-table-names columns claims)))

(defn csv? [importer-type ]
  (contains? #{"LINK" "CSV" "DATA_FILE" "clj"} importer-type))

(defn adapter-value [k t x]
  (log/debug :k k :adapter-value t x)
  (if (= "rnum" k)
    x
    (case t
      "text" x
      "number" x
      "date" (java.time.Instant/ofEpochMilli x)
      "geoshape" (postgres/val->geometry-pgobj x)
      "geopoint" (postgres/val->geometry-pgobj x)
      "multiple" x
      "option" x)))

(defn adapter-rows [tenant-conn data-source dataset-id]
  (let [import-type (-> data-source (get-in [:spec "source" "kind"])) ;;"DATA_FILE"
        {:keys [imported-table-name columns] :as dsv1}(db.transformation/initial-dataset-version-to-update-by-dataset-id
                                     tenant-conn
                                     {:dataset-id dataset-id})
        dict-type (reduce #(assoc % (or
                                     (get  %2 "columnName")
                                     (get  %2 :columnName))
                                  (or
                                   (get  %2 "type")
                                   (get  %2 :type))) {} columns)

        column-group-dict (reduce (fn [c co]
                                    (assoc c  (get co "columnName") (get co "groupId") )
                                    ){} columns)
        ]
           (log/error column-group-dict)

    (->> (jdbc/query tenant-conn [(format "SELECT * FROM %s ORDER BY rnum" imported-table-name)])
         (map (fn [x]
                (if (csv? import-type)
                  (let [x2 (reduce (fn [c [k v]]
                                      (assoc c k (adapter-value k (get dict-type k) v))
                                     ) {} (w/stringify-keys x))]
                    {"main" [x2]})

                  (let [it (w/stringify-keys x)]
                    (->> (reduce (fn [c [k v]]
                                   (if-let [group-id (column-group-dict k)]
                                     (update c (column-group-dict k) (fn [x]
                                                                       (let [v2 (adapter-value k (get dict-type k) v)]
                                                                         (if x
                                                                           (assoc x k v2)
                                                                           {k v2}
                                                                           ))))
                                     c)
                                   ){} it)
                         (reduce (fn [c [k v]]
                                   (assoc c k [(merge {"instance_id" (get it "instance_id")} v)])) {})))))))
))

(comment
  (let [dataset-id "609bcbef-fe39-41a6-ba26-a47b4b945c15"
       tenant-conn (dev/db-conn "t1")]
   (let [initial-dataset-version (db.transformation/initial-dataset-version-to-update-by-dataset-id tenant-conn {:dataset-id dataset-id})
         latest-dataset-version (db.transformation/latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})]
     (let [data-source (adapter-data-source tenant-conn dataset-id)
           job-execution-id (:job_execution_id data-source)
           claims (adapter-claims data-source)
           rows (adapter-rows tenant-conn data-source dataset-id)
           columns (w/keywordize-keys (:columns initial-dataset-version))]
       (first rows)

       )
     ))

  )

(defn adapter-claims [data-source]
    (let [email (get-in data-source [:spec "source" "email"])]
    {"email" email "name" email}))

(defn adapter-data-source [tenant-conn dataset-id]
  (db.data-source/db-data-source-by-dataset-id tenant-conn {:dataset-id dataset-id}))

(comment
  (let [tenant-conn (dev/db-conn "t1")
        dataset-id "609badab-0ba8-40df-ba16-03898b773da9"
        data-source (adapter-data-source tenant-conn dataset-id)
        claims (adapter-claims data-source)]
    (adapter-rows tenant-conn data-source dataset-id))

  (let [tenant-conn (dev/db-conn )
        dataset-id "609b915b-e527-4011-9b7a-eae4a5359ec5"
        data-source (adapter-data-source tenant-conn dataset-id)
        claims (adapter-claims data-source)]
    (first (adapter-rows tenant-conn data-source dataset-id))
    claims
    )



  (let [dataset-id "609c0344-1fc3-4665-8cb5-b47434919e04"
        tenant-conn (dev/db-conn "t1")]
    (let [initial-dataset-version (db.transformation/initial-dataset-version-to-update-by-dataset-id tenant-conn {:dataset-id dataset-id})
          latest-dataset-version (db.transformation/latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})]
      (let [data-source (adapter-data-source tenant-conn dataset-id)
              job-execution-id (:job_execution_id data-source)
              claims (adapter-claims data-source)
              rows (adapter-rows tenant-conn data-source dataset-id)
              columns (w/keywordize-keys (:columns initial-dataset-version))]
          (adapter tenant-conn rows columns job-execution-id dataset-id claims)
          )
      #_(if (= (:version initial-dataset-version) (:version latest-dataset-version))
        :no-tx
        [:txs (:transformations latest-dataset-version)])))




  (akvo.lumen.db.dataset/dataset-by-id (dev/db-conn) {:id "609a8c81-02da-4e94-9bde-4881cc8e05be"})



  )
