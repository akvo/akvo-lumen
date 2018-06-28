(ns akvo.lumen.test-utils
  (:require [akvo.lumen.component.tenant-manager :refer [pool]]
            [akvo.lumen.import :refer [do-import]]
            [akvo.lumen.util :refer [squuid]]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.tools.logging :as log]
            [clojure.spec.test.alpha :as stest]
            [clojure.spec.test.alpha :as st]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/job-execution.sql")


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
  "Import a file and return the dataset-id"
  [tenant-conn error-tracker file {:keys [dataset-name has-column-headers?]}]
  (let [data-source-id (str (squuid))
        job-id (str (squuid))
        data-source-spec {"name" (or dataset-name file)
                          "source" {"path" (.getAbsolutePath (io/file (io/resource file)))
                                    "kind" "DATA_FILE"
                                    "fileName" (or dataset-name file)
                                    "hasColumnHeaders" (boolean has-column-headers?)}}]
    (insert-data-source tenant-conn {:id data-source-id :spec data-source-spec})
    (insert-job-execution tenant-conn {:id job-id :data-source-id data-source-id})
    (do-import tenant-conn {:file-upload-path "/tmp/akvo/dash"} error-tracker job-id)
    (:dataset_id (dataset-id-by-job-execution-id tenant-conn {:id job-id}))))

(defmacro try-specs
  "run body code with spec instrument/validation"
  [& body]
  `(try
     (stest/instrument)
     ~@body
     (finally (stest/unstrument))))

(defmacro with-instrument-disabled [& body]
  `(stest/with-instrument-disabled ~@body))

(defn instrument-fixture [f]
  (log/warn "instrument-fixture")
  (st/instrument)
  (f)
  (log/warn "unstrument-fixture")
  (st/unstrument))
