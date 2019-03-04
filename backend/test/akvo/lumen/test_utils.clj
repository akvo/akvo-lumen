(ns akvo.lumen.test-utils
  (:require [akvo.lumen.auth :as auth]
            [akvo.lumen.lib.aes :as aes]
            [akvo.lumen.lib.import :as import]
            [akvo.lumen.lib.import.clj-data-importer]
            [akvo.lumen.lib.update :as update]
            [akvo.lumen.postgres]
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
(derive :akvo.lumen.test-utils/public-path?-dev :akvo.lumen.auth/public-path?)
(derive :akvo.lumen.auth/wrap-jwt-prod :akvo.lumen.auth/wrap-jwt)
(derive :akvo.lumen.test-utils/public-path?-test :akvo.lumen.auth/public-path?)
(derive :akvo.lumen.test-utils/wrap-jwt-mock :akvo.lumen.auth/wrap-jwt)

(defn dissoc-prod-components [c more-ks]
  (let [ks [:akvo.lumen.component.emailer/mailjet-v3-emailer
            :akvo.lumen.component.caddisfly/prod
            :akvo.lumen.component.error-tracker/prod
            :akvo.lumen.auth/public-path?-prod
            :akvo.lumen.test-utils/public-path?-dev
            :akvo.lumen.auth/wrap-jwt-prod]
        ks (if more-ks (apply conj ks more-ks) ks)]
    (apply dissoc c ks)))


(defn prep [& paths]
  (ig/prep (apply duct/merge-configs (map read-config (filter some? paths)))))

(defn halt-system [system]
  (when system (ig/halt! system)))

(defn start-config
  ([]
   (start-config nil nil))
  ([edn-config more-ks]
   (let [c (dissoc-prod-components (prep "akvo/lumen/config.edn" "dev.edn" "test.edn" edn-config)
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
  (let [db-uri (-> config :akvo.lumen.component.hikaricp/hikaricp :uri)]
    (doseq [tenant (-> config :akvo.lumen.migrate/migrate :seed :tenants)]
      (seed-tenant {:connection-uri db-uri} tenant))))


(defn public-path-dev? [{:keys [path-info request-method] :as data}]
  (or (auth/public-path? data)
      (str/starts-with? path-info "/local-development")))

(defmethod ig/init-key :akvo.lumen.test-utils/public-path?-dev  [_ opts]
  (log/error :akvo.lumen.test-utils/public-path?-dev)
  public-path-dev?)

(defmethod ig/init-key :akvo.lumen.test-utils/public-path?-test  [_ opts]
  (log/error :akvo.lumen.test-utils/public-path?-test)
  (constantly true))


(defmethod ig/init-key :akvo.lumen.test-utils/wrap-jwt-mock  [_ {:keys [keycloak]}]
  (fn [handler]
    (fn [req]
      (handler (assoc req :jwt-claims {"typ" "Bearer"})))))

