(ns akvo.lumen.test-utils
  (:require [akvo.lumen.component.tenant-manager :refer [pool]]
            [akvo.lumen.lib.import :as import]
            [akvo.lumen.lib.import.clj-data-importer]
            [akvo.lumen.lib.update :as update]
            [akvo.lumen.postgres]
            [akvo.lumen.lib.transformation.engine :refer (new-dataset-version)]
            [akvo.lumen.specs.transformation]
            [robert.hooke :refer (add-hook) :as r]
            [akvo.lumen.util :refer [squuid] :as util ]
            [cheshire.core :as json]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.set :as set]
            [clojure.spec.alpha :as s]
            [clojure.spec.test.alpha :as stest]
            [clojure.test :as t]
            [clojure.tools.logging :as log]
            [clojure.walk :refer (keywordize-keys)]
            [diehard.core :as dh]
            [hugsql.core :as hugsql]))

(defn dataset-version-spec-adapter
  "provisional spec adapter function to be removed when specs work was finished"
  [dsv]
  (letfn [(>mult [i]
            (-> i
                (update :multipleType keyword)
                (set/rename-keys {:multipleType :multiple-type
                                  :multipleId :multiple-id})))
          (>column [e]
            (when e
              (cond-> e
               true (update :type keyword)
               true (update :id (fn [o] (if o (keyword o) (keyword (:columnName e)))))
               (:multipleType e) >mult)))
          (>changedColumns [cc]
            (reduce-kv (fn [c k {:keys [before after] :as v}]
                         ;; (log/info :v v  (>column v))
                         (assoc c (name k) {:before (>column before) :after (>column after)})
                         ) {} cc))]
    (let [res  (-> (keywordize-keys dsv)
                   (update :transformations #(mapv (fn [t] (update t :op keyword)) %))
                   (update :columns #(mapv >column %))
                   (update :transformations #(mapv (fn [t]
                                                     (let [t (if (or (= :core/split-column (:op t))
                                                                     (= :core/extract-multiple (:op t)))
                                                               (update-in t [:args :selectedColumn] >column)
                                                               t)]
                                                       (update t :changedColumns >changedColumns))) %)))]
      res)))

(defn new-dataset-version-conform
  [f t d]
  (log/info :conforming :akvo.lumen.specs.transformation/next-dataset-version)
  (util/conform :akvo.lumen.specs.transformation/next-dataset-version d dataset-version-spec-adapter)
  (f t d))

(doseq [v [#'new-dataset-version #'import/new-dataset-version]]
  (r/clear-hooks v)
  (r/add-hook v #'new-dataset-version-conform))

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
