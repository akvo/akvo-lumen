(ns akvo.lumen.lib.data-groups-adapter
  (:require [akvo.lumen.db.data-source :as db.data-source]
            [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.lib.transformation.engine :as engine]
            [akvo.lumen.lib.import.data-groups :as i.data-groups]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.protocols :as p]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [clojure.walk :as w]
            [amazonica.aws.s3 :as s3]
            [amazonica.aws.s3transfer :as s3t]
            [clojure.data.xml :as xml]
            [clojure.set :as set]
            [hugsql.core :as hugsql]))



(hugsql/def-db-fns "akvo/lumen/lib/adapter.sql")

(defn adapter [conn rows columns job-execution-id dataset-id claims]
  (let [_ (log/debug :columns-dsv2 columns)
        {:keys [columns group-table-names]} (i.data-groups/adapt-columns columns)
        columns (if-let [instance_id (first (filter #(= "instance_id" (get % :columnName))columns))]
                  (reduce (fn [c groupId]
                            (conj c (assoc instance_id
                                           :groupId groupId
                                           :groupName groupId))
                            ) columns (disj (set (keys (group-by :groupId columns))) "metadata"))
                  columns)
        group-cols (group-by :groupId columns)]
    (log/debug :group-cols group-cols)
    (doseq [[groupId cols] group-cols]
      (postgres/create-dataset-table conn (get group-table-names groupId) cols))
    (doseq [response (take common/rows-limit rows)]
      (log/debug :response-dsv2 response )
      (doseq [[groupId iterations] response]
        (let [table-name (get group-table-names groupId)]
          (log/debug :its iterations)
          (jdbc/insert-multi! conn table-name (mapv postgres/coerce-to-sql iterations)))))
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
                                    ){} columns)]
    (log/debug column-group-dict)
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
                                   (assoc c k [(merge {"instance_id" (get it "instance_id")} v)])) {})))))))))

(defn adapter-claims [data-source]
    (let [email (get-in data-source [:spec "source" "email"])]
    {"email" email "name" email}))

(defn adapter-data-source [tenant-conn dataset-id]
  (db.data-source/db-data-source-by-dataset-id tenant-conn {:dataset-id dataset-id}))

(defn adapt-columns-group [jwt-token flow-api tenant-conn dataset-id columns]
  (let [spec (merge
              (:source (akvo.lumen.db.dataset/dataset-by-id tenant-conn {:id dataset-id}))
              {"token" jwt-token})]
    (if (= "AKVO_FLOW" (get spec "kind"))
      (let [importer ((get-method common/datagroups-importer "AKVO_FLOW")
                      spec {:flow-api flow-api})
            flow-columns(p/columns importer)]
        (mapv (fn [c]
                (if-let [flow-col (first (filter (fn [fc]
                                                   (= (:columnName c) (:id fc))) flow-columns ))]
                  (merge c (select-keys flow-col [:groupName :groupId]))
                  (throw (ex-info "no flow-col" {:flow-columns flow-columns
                                                 :c c} ))
                  )
                ) columns)
        )
      columns)))

(defn merge-tx-dsv-ordered-by-date [conn]
  (->> (all-merge-dsv-bis conn)
       (mapv (fn [dsv]
               (-> (select-keys dsv [:id :created :dataset_id :version])
                   (assoc  :transformations (seq (filter (fn [t]
                                                           (= "core/merge-datasets" (get t "op"))
                                                           )(:transformations dsv)))))))
       (group-by :dataset_id)
       (reduce (fn [xx [dataset_id dsvs]]
                 (into xx (let [txs (vec (reduce
                                          (fn [c dsv]
                                            (reduce  (fn [cc tx]
                                                       (if-not (contains? cc tx)
                                                         (conj cc (with-meta tx dsv))
                                                         cc))  c (:transformations dsv)))
                                          #{} (sort-by :version dsvs)))]
                            (mapv (fn [tx]
                                    (merge (select-keys (meta tx) [:created :dataset_id :version :id])
                                           {:args-source (get-in tx ["args" "source"])})
                                    ) txs)))) [])
       (sort-by :created)
       (mapv (fn [x]
               (assoc x :created (java.time.Instant/ofEpochMilli (:created x)))))))

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


(:source (akvo.lumen.db.dataset/dataset-by-id (dev/db-conn "t1") {:id "609bb44d-8595-4eb5-8ca0-3423bbf91740"}))


(let [dataset-id "609c05bc-a6d8-4a4c-8abd-e9b3221b6b54"
      tenant-conn (dev/db-conn "t1")]
  (let [initial-dataset-version (db.transformation/initial-dataset-version-to-update-by-dataset-id tenant-conn {:dataset-id dataset-id})
        latest-dataset-version (db.transformation/latest-dataset-version-by-dataset-id tenant-conn {:dataset-id dataset-id})]
    (let [data-source (adapter-data-source tenant-conn dataset-id)
          job-execution-id (:job_execution_id data-source)
          claims (adapter-claims data-source)
          rows (adapter-rows tenant-conn data-source dataset-id)
          columns (->> (:columns initial-dataset-version)
                       (w/keywordize-keys)
                       (adapt-columns-group (dev/jwt-token) (:akvo.lumen.component.flow/api (dev/isystem)) tenant-conn dataset-id))]
      (adapter tenant-conn rows columns job-execution-id dataset-id claims)
      (if (= (:version initial-dataset-version) (:version latest-dataset-version))
        :no-tx
        (let [current-dataset-version (db.dataset-version/latest-dataset-version-2-by-dataset-id tenant-conn {:dataset-id dataset-id})]
          (engine/apply-undo-2 {:tenant-conn tenant-conn
                                :claims claims
                                :txs (:transformations latest-dataset-version)

                                }
                               dataset-id
                               job-execution-id
                               current-dataset-version))))))







(merge-tx-dsv-ordered-by-date (dev/db-conn "t1"))



(all-merge-dsv-bis (dev/db-conn "t1"))


(def aws-creds1 {:access-key ""
                 :secret-key ""
                 :endpoint   "us-west-1"})
(def aws-creds2 {:access-key ""
                 :secret-key ""
                 :endpoint   "us-west-1"})


#_(s3/list-buckets aws-creds1
                   {:client-config {
                                    :path-style-access-enabled false
                                    :chunked-encoding-disabled false
                                    :accelerate-mode-enabled false
                                    :payload-signing-enabled true
                                    :dualstack-enabled true
                                    :force-global-bucket-access-enabled true}})

(def key-pair
  (let [kg (java.security.KeyPairGenerator/getInstance "RSA")]
    (.initialize kg 1024 (java.security.SecureRandom.))
    (.generateKeyPair kg)))

(defn form
  ([flow-instance-id survey-id]
   (try (form aws-creds1 flow-instance-id survey-id)
        (catch Exception e (form aws-creds2 flow-instance-id survey-id)))
   )
  ([creds flow-instance-id survey-id]
   (let [stream (-> (s3/get-object creds :bucket-name (str "akvoflow-" flow-instance-id)
                                   :encryption {:key-pair key-pair}
                                   :key (format "surveys/%s.zip" survey-id))
                    :input-stream

                    (java.util.zip.ZipInputStream.)

                    )]
     (.getNextEntry stream)
     (xml/parse-str (slurp stream)))))

(defn questions [xml-questions]
  (mapv (fn [e]  (-> (select-keys (:attrs e) [:id :order :type])
                     (assoc :name (->  e :content last :content first)))) xml-questions))
(defn groups [xml-form]
  (mapv (fn [e]
          {(-> e :content first :content first)
           (questions (-> e :content next))}) (:content xml-form)))
(comment
  (groups (form "161" "26200002"))
;;=>   [{"SCHOOL BASELINE " [{:id "25160084", :order "1", :type "cascade", :name "Location Details"} {:id "20230028", :order "2", :type "free", :name "Name of The School "} {:id "25250003", :order "3", :type "option", :name "What is the type of school?"} {:id "22200002", :order "4", :type "photo", :name " Take a photo of the school and school sign"} {:id "28080020", :order "5", :type "geo", :name "Take the GPS location at the school"}]}]
  (groups (form "7" "979504001")))
