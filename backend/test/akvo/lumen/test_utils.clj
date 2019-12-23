(ns akvo.lumen.test-utils
  (:require [akvo.lumen.auth :as auth]
            [akvo.lumen.component.hikaricp :as hikaricp]
            [akvo.lumen.lib.auth :as l.auth]
            [akvo.lumen.lib.aes :as aes]
            [akvo.lumen.lib.import :as import]
            [akvo.lumen.config :as config]
            [akvo.lumen.lib.import.clj-data-importer]
            [akvo.lumen.lib.update :as update]
            [akvo.lumen.postgres]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.specs.transformation]
            [cheshire.core :as json]
            [clj-time.coerce :as tcc]
            [clj-time.core :as tc]
            [clj-time.format :as timef]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [clojure.spec.alpha :as s]
            [clojure.spec.test.alpha :as stest]
            [clojure.string :as str]
            [clojure.test :as t]
            [clojure.tools.logging :as log]
            [diehard.core :as dh]
            [duct.core :as duct]
            [hugsql.core :as hugsql]
            [integrant.core :as ig])
  (:import [java.time Instant]
           [org.postgresql.util PSQLException]))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")
(hugsql/def-db-fns "akvo/lumen/lib/dataset.sql")
(hugsql/def-db-fns "akvo/lumen/lib/raster.sql")
(hugsql/def-db-fns "akvo/lumen/lib/visualisation.sql")
(hugsql/def-db-fns "akvo/lumen/lib/dashboard.sql")
(hugsql/def-db-fns "akvo/lumen/lib/collection.sql")

(defn retry-job-execution [tenant-conn job-execution-id with-job?]
  (dh/with-retry {:retry-if (fn [v e] (not v))
                  :max-retries 20
                  :delay-ms 100}
    (let [job (job-execution-by-id tenant-conn {:id job-execution-id})
          ds-job (datasource-job-execution-by-id tenant-conn {:id job-execution-id})
          status (:status job)
          res (when (and status (not= "PENDING" status))
                (if (= "OK" status)
                  (:dataset_id ds-job)
                  job-execution-id))]
      (when res
        (if with-job?
          [job ds-job]
          res)))))

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
              "source" (with-meta
                         {"path" (when file (.getAbsolutePath (io/file (io/resource file))))
                          "kind" (or kind "DATA_FILE")
                          "fileName" (or dataset-name file)
                          "hasColumnHeaders" (boolean has-column-headers?)}
                         {:data data})}
        [tag {:strs [importId]}] (import/handle tenant-conn {} error-tracker {} spec)]
    (t/is (= tag :akvo.lumen.lib/ok))
    (retry-job-execution tenant-conn importId with-job?)))

(defn update-file
  "Update a file and return the dataset-id, or the job-execution-id in case of FAIL status"
  [tenant-conn caddisfly error-tracker dataset-id data-source-id {:keys [data has-column-headers? kind with-job?]}]
  (let [spec {"source" (with-meta {"kind" kind
                                   "hasColumnHeaders" (boolean has-column-headers?)}
                         {:data data})}
        [tag {:strs [updateId] :as res}] (update/update-dataset tenant-conn caddisfly {} error-tracker dataset-id data-source-id spec)]
    (t/is (= tag :akvo.lumen.lib/ok))
    (retry-job-execution tenant-conn updateId with-job?)))

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


(derive :akvo.lumen.component.error-tracker/config-test :akvo.lumen.component.error-tracker/config)

(derive :akvo.lumen.component.error-tracker/void :akvo.lumen.component.error-tracker/client)

(derive :akvo.lumen.utils.dev-emailer/emailer :akvo.lumen.component.emailer/emailer)
(derive :akvo.lumen.component.caddisfly/local :akvo.lumen.component.caddisfly/caddisfly)
(derive :akvo.lumen.component.error-tracker/local :akvo.lumen.component.error-tracker/error-tracker)


(defn dissoc-prod-components [c more-ks]
  (let [ks [:akvo.lumen.component.emailer/mailjet-v3-emailer
            :akvo.lumen.component.caddisfly/prod

            :akvo.lumen.component.error-tracker/config-prod
            :akvo.lumen.component.error-tracker/sentry
            ]
        ks (if more-ks (apply conj ks more-ks) ks)]
    (apply dissoc c ks)))

(defn halt-system [system]
  (when system (ig/halt! system)))

(defn start-config
  ([]
   (start-config nil nil))
  ([edn-config more-ks]
   (let [c (dissoc-prod-components (config/prep ["akvo/lumen/config.edn" "test.edn" edn-config])
                                   more-ks)]
     (ig/load-namespaces c)
     c)))

(start-config "endpoint-tests.edn"
              [:akvo.lumen.test-utils/public-path?-dev
               :akvo.lumen.auth/wrap-jwt-prod])

(defn start-system [config]
  (ig/init config))

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
  (let [db-uri (hikaricp/ssl-url (-> config :akvo.lumen.component.hikaricp/hikaricp :uri))]
    (doseq [tenant (-> config :akvo.lumen.migrate/migrate :seed :tenants)]
      (seed-tenant {:connection-uri db-uri} tenant))))

(defmethod ig/init-key :akvo.lumen.test-utils/wrap-jwt-mock  [_ {:keys [public-client]}]
  (fn [handler]
    (fn [req]
      (handler (assoc req :jwt-claims {"typ" "Bearer"
                                       "given_name" "User$auth$"})))))

(defmethod ig/init-key :akvo.lumen.test-utils/wrap-auth-datasets  [_ {:keys [tenant-manager] :as opts}]
  (fn [handler]
    (fn [{tenant :tenant
          :as req}]
      (let [tenant-conn (p/connection tenant-manager tenant)]
        (handler (assoc req :auth-service
                        (l.auth/new-auth-service {:auth-datasets       (map :id (all-datasets tenant-conn))
                                                  :auth-visualisations (mapv :id (all-visualisations tenant-conn))
                                                  :auth-dashboards     (mapv :id (all-dashboards tenant-conn))
                                                  :auth-collections    (mapv :id (all-collections tenant-conn))
                                                  :rasters             (mapv :id (all-rasters tenant-conn))})))))))
