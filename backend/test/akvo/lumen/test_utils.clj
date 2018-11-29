(ns akvo.lumen.test-utils
  (:require [akvo.lumen.component.tenant-manager :refer [pool]]
            [akvo.lumen.util :refer [squuid]]
            [clojure.edn :as edn]
            [akvo.lumen.lib.import :as import]
            [diehard.core :as dh]
            [clojure.tools.logging :as log]
            [clojure.test :as t]
            [clojure.spec.test.alpha :as stest]
            [clojure.java.io :as io]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/job-execution.sql")

(defn spec-instrument
  "Fixture to instrument all functions"
  [f]
  (stest/instrument)
  (let [r (f)]
    (stest/unstrument)
    r))

(def seed-data
  (->> "test-seed.edn"
       io/resource
       slurp
       edn/read-string))

(def test-tenant-manager
  (:tenant-manager seed-data))

(def test-tenant
  (first (filter #(= "t1" (:label %))
                 (:tenants seed-data))))

(let [conn-cache (atom {})]
  (defn test-tenant-conn
    "Returns a Hikaricp for provided tenant, connections are cached."
    [{:keys [label] :as tenant}]
    (if-let [tenant-conn (get @conn-cache label)]
      tenant-conn
      (get (swap! conn-cache assoc label (pool tenant)) label))))

(defn import-file
  "Import a file and return the dataset-id, or the job-execution-id in case of FAIL status"
  [tenant-conn error-tracker {:keys [file dataset-name has-column-headers?]}]
  (let [spec {"name" (or dataset-name file)
              "source" {"path" (.getAbsolutePath (io/file (io/resource file)))
                        "kind" "DATA_FILE"
                        "fileName" (or dataset-name file)
                        "hasColumnHeaders" (boolean has-column-headers?)}}
        [tag {:strs [importId]}] (import/handle tenant-conn {} error-tracker {} spec)]
    (t/is (= tag :akvo.lumen.lib/ok))
    (dh/with-retry {:retry-if (fn [v e] (not v))
                    :max-retries 20
                    :delay-ms 100}
      (let [job (job-execution-by-id tenant-conn {:id importId})
            status (:status job)]
                 (when (not= "PENDING" status)
                   (if (= "OK" status)
                     (:dataset_id (dataset-id-by-job-execution-id tenant-conn {:id importId}))
                     importId))))))
