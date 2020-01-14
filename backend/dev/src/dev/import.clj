(ns dev.import
  (:require [akvo.lumen.utils.local-error-tracker :as et]
            [akvo.lumen.test-utils :as tu]
            [clj-time.core :as tc]
            [clojure.pprint :refer [pprint]]
            [akvo.lumen.protocols :as p]
            [clojure.spec.alpha :as s]
            [clojure.spec.test.alpha :as stest]
            [clojure.tools.logging :as log]
            [dev.commons :as commons]
            [dev :as dev]
            [integrant.repl.state :as state :refer (system)]))

(def error-tracker (et/local-error-tracker))

(defn t1-conn []
  (when-not system
    (dev/go))
  (p/connection (:akvo.lumen.component.tenant-manager/tenant-manager system) (-> commons/tenants first :label)))

(defn clj-data>dataset [{:keys [dataset-name data with-job? job]}]
  (if job
    (tu/update-file (t1-conn)
                    (:akvo.lumen.component.caddisfly/caddisfly system)
                    error-tracker
                      (:dataset_id job)
                      (:data_source_id job)
                      {:kind         "clj"
                       :data         data})
    (tu/import-file (t1-conn) error-tracker {:dataset-name (str dataset-name ":" (tc/now))
                                          :kind         "clj"
                                          :data         data
                                          :with-job?    with-job?})))

(comment
  "example import and update with clojure data"
  (let [data0              {:columns [{:id "c1", :title "A", :type "text"}]
                            :rows    [[{:value "a"}]
                                      [{:value "b"}]
                                      [{:value "c"}]]}
        [{:keys [dataset_id
                 data_source_id]
          :as   job}
         dataset]          (clj-data>dataset {:data         data0
                                              :dataset-name "example"
                                              :with-job?    true})
        _                  (log/error :import-result [job dataset])
        updated-dataset-id (clj-data>dataset {:data (update data0
                                                            :rows
                                                            (fn [i] (map #(vector {:value %}) (range 10))))
                                              :job  job})]
    updated-dataset-id)
  )
