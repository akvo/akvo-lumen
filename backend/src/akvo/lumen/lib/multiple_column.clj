(ns akvo.lumen.lib.multiple-column
  (:require [clojure.tools.logging :as log]
            [ring.util.response :refer [response not-found]]))

(defn- extract
  [caddisfly id]
  (when id
    (if-let [schema (get (:schema caddisfly) id)]
      (let [res (select-keys schema [:hasImage])]
        (assoc res :columns (map (fn [r]
                                   {:id   (:id r)
                                    :name (format "%s (%s)" (:name r) (:unit r))
                                    :type "text" ;; TODO will be improved after design discussions 
                                    }) (:results schema)))))))

(defn details
  "depending of type of multiple columns we dispatch to different logic impls"
  [{:keys [caddisfly] :as deps} multiple-type multiple-id]
  (log/debug ::all :multiple-type multiple-type :multiple-id multiple-id)
  (condp = multiple-type
    "caddisfly" (if-let [res (extract caddisfly multiple-id)]
                  (response res)
                  (not-found {:message "caddisfly id not found"
                              :multiple-id multiple-id}))
    (not-found {:type multiple-type})))
