(ns dev.aggregation-dev
  (:require [akvo.lumen.lib.aggregation :as aggregation]
            [clojure.pprint :refer [pprint]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.test-utils :as tu]
            [clojure.spec.test.alpha :as stest]
            [clojure.tools.logging :as log]
            [dev.import-dev :as import-dev]))

(defn query [dataset-id t q]
  (let [q (if (:filters q) q (assoc q :filters []))]
    (aggregation/query (import-dev/t1-conn) dataset-id t q)))

(comment
  "aggregation query example"
  (let [data0 {:columns [{:id "c1", :title "A", :type "text"}]
               :rows    [[{:value "a"}]
                         [{:value "b"}]
                         [{:value "c"}]]}
        [job ] (import-dev/clj-data>dataset {:data data0
                                             :dataset-name "example"
                                             :with-job? true})]

    (-> (import-dev/clj-data>dataset {:data (update data0 :rows (constantly [[{:value "a"}]]))
                                      :job  job})
        (query "bar" {:bucketColumn "c1"})))
  )
