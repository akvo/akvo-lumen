(ns akvo.lumen.lib.multiple-column
  (:require [clojure.tools.logging :as log]
            [akvo.lumen.component.caddisfly :as c.caddisfly]
            [ring.util.response :refer [response not-found]]))

(defn- extract
  [caddisfly id]
  (when id
    (if-let [schema (c.caddisfly/get-schema caddisfly id)]
      (-> (select-keys schema [:hasImage])
          (assoc :columns (map (fn [r]
                                 {:id   (:id r)
                                  :name (format "%s (%s)" (:name r) (:unit r))
                                  :type "text" ;; TODO will be improved after design discussions
                                  }) (:results schema)))))))

(defn details
  "depending of type of multiple columns we dispatch to different logic impls"
  [{:keys [caddisfly] :as deps} multipleType multipleId]
  (log/debug ::all :multipleType multipleType :multipleId multipleId)
  (condp = multipleType
    "caddisfly" (if-let [res (extract caddisfly multipleId)]
                  (response res)
                  (not-found {:message "caddisfly id not found"
                              :multipleId multipleId}))
    (not-found {:type multipleType})))
