(ns akvo.lumen.test-utils
  (:require [akvo.lumen.component.tenant-manager :refer [pool]]
            [akvo.lumen.config :as config]
            [akvo.lumen.lib.aes :as aes]
            [akvo.lumen.lib.import :as import]
            [akvo.lumen.lib.import.clj-data-importer]
            [akvo.lumen.lib.transformation.engine :refer (new-dataset-version)]
            [akvo.lumen.lib.update :as update]
            [akvo.lumen.postgres]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.specs.transformation]
            [akvo.lumen.util :refer [squuid] :as util ]
            [cheshire.core :as json]
            [clj-time.coerce :as tcc]
            [clj-time.core :as tc]
            [clj-time.format :as timef]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [clojure.set :as set]
            [clojure.spec.alpha :as s]
            [clojure.spec.test.alpha :as stest]
            [clojure.test :as t]
            [clojure.tools.logging :as log]
            [clojure.walk :refer (keywordize-keys)]
            [diehard.core :as dh]
            [duct.core :as duct]
            [hugsql.core :as hugsql]
            [integrant.core :as ig])
  (:import [java.time Instant]
           [org.postgresql.util PSQLException]))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")

(defn spec-instrument
  "Fixture to instrument all functions"
  [f]
  (stest/instrument)
  (let [r (f)]
    (stest/unstrument)
    r))

(defn import-file
  "Import a file and return the dataset-id, or the job-execution-id in case of FAIL status"
  [tenant-conn error-tracker {:keys [file dataset-name has-column-headers? kind data with-job?]}]
  (let [spec {"name" (or dataset-name file)
              "source" {"path" (when file (.getAbsolutePath (io/file (io/resource file))))
                        "kind" (or kind "DATA_FILE")
                        "fileName" (or dataset-name file)
                        "data" data
                        "hasColumnHeaders" (boolean has-column-headers?)}}
        [tag {:strs [importId]}] (import/handle tenant-conn {} error-tracker {} spec)]
    (t/is (= tag :akvo.lumen.lib/ok))
    (dh/with-retry {:retry-if (fn [v e] (not v))
                    :max-retries 20
                    :delay-ms 100}
      (let [job (job-execution-by-id tenant-conn {:id importId})
            status (:status job)
            dataset (dataset-id-by-job-execution-id tenant-conn {:id importId})
            res (when (not= "PENDING" status)
                  (if (= "OK" status)
                    (:dataset_id dataset)
                    importId))]
        (when res
          (if  with-job?
            [job dataset]
            res))))))

(defn update-file
  "Update a file and return the dataset-id, or the job-execution-id in case of FAIL status"
  [tenant-conn error-tracker dataset-id data-source-id {:keys [data has-column-headers? kind]}]
  (let [spec {"source" {"kind" kind
                        "hasColumnHeaders" (boolean has-column-headers?)
                        "data" data}}
        [tag {:strs [updateId] :as res}] (update/update-dataset tenant-conn {} error-tracker dataset-id data-source-id spec)]
    (t/is (= tag :akvo.lumen.lib/ok))
    (dh/with-retry {:retry-if (fn [v e] (not v))
                    :max-retries 20
                    :delay-ms 100}
      (let [job (job-execution-by-id tenant-conn {:id updateId})
            status (:status job)]
        (when (not= "PENDING" status)
          (if (= "OK" status)
            (:dataset_id (dataset-id-by-job-execution-id tenant-conn {:id updateId}))
            updateId))))))

(defn rand-bol []
  (if (= 0 (rand-int 2)) false true))

(defn- replace-item
  "Returns a list with the n-th item of l replaced by v."
  [l n v]
  (concat (take n l) (list v) (drop (inc n) l)))

(defn at-least-one-true
  "returns a seq of boolean with a minimum one true"
  [c]
  (let [res (for [r (range c)]
              (rand-bol))]
    (if (some true? res)
      res
      (replace-item res (rand-int c) true))))

(defn clj>json>clj [d]
  (json/decode (json/generate-string d)))

(defn instant-date
  "receives a string that represents a date dd/MM/yyyy
   returns an java.time.Instant object "
  [d]
  (->> d
       (timef/parse (timef/formatter "dd/MM/yyyy"))
       tcc/to-long
       Instant/ofEpochMilli))

;; system utils

(defn read-config
  [resource-path]
  (duct/read-config (io/resource resource-path)))

(derive :akvo.lumen.component.emailer/dev-emailer :akvo.lumen.component.emailer/emailer)
(derive :akvo.lumen.component.caddisfly/local :akvo.lumen.component.caddisfly/caddisfly)
(derive :akvo.lumen.component.error-tracker/local :akvo.lumen.component.error-tracker/error-tracker)

(defn dissoc-prod-components [c]
  (dissoc c
          :akvo.lumen.component.emailer/mailjet-v3-emailer
          :akvo.lumen.component.caddisfly/prod
          :akvo.lumen.component.error-tracker/prod))

(defn prep [& paths]
  (ig/prep (apply duct/merge-configs (map read-config paths))))

(defn halt-system [system]
  (when system (ig/halt! system)))

(defn start-config []
  (let [c (dissoc-prod-components (prep "akvo/lumen/config.edn" "dev.edn" "test.edn"))]
             (ig/load-namespaces c)
             c))

(defn start-system []
  (ig/init (start-config)))

(defn- seed-tenant
  "Helper function that will seed tenant to the tenants table."
  [db tenant]
  (try
    (let [{:keys [id]} (first (jdbc/insert! db "tenants" (update (dissoc tenant :plan)
                                                                 :db_uri #(aes/encrypt "secret" %))))]
      (jdbc/insert! db "plan" {:tenant id
                               :tier (doto (org.postgresql.util.PGobject.)
                                       (.setType "tier")
                                       (.setValue (:plan tenant)))}))
    (catch PSQLException e
      (println "Seed data already loaded."))))

(defn seed
  "At the moment only support seed of tenants table."
  [config]
  (let [db-uri (-> config :akvo.lumen.component.hikaricp/hikaricp :uri)]
    (doseq [tenant (-> config :akvo.lumen.migrate/migrate :seed :tenants)]
      (seed-tenant {:connection-uri db-uri} tenant))))



