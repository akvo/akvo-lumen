(ns akvo.lumen.lib.resource-impl
  (:require [akvo.lumen.util :refer [squuid]]
            [hugsql.core :as hugsql]
            [ring.util.response :refer [not-found response]])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "akvo/lumen/lib/resource.sql")


#_(defn current-plan [tenant-conn]
    (if-let [r (select-plan tenant-conn)]
      r
      {"tier" "planless"}))

#_(defn count-visualisation-fn [tenant-conn _]
    (:numberOfVisualisations (count-visualisations tenant-conn
                                                   {}
                                                   {}
                                                   {:identifiers identity})))

#_(defn data-update-fn [tenant-conn tier]
    (-> (select-data-update-by-tier tenant-conn
                                    {:tier tier}
                                    {}
                                    {:identifiers identity})
        first :dataUpdate))

#_(def policy-map
    {"numberOfVisualisations" count-visualisation-fn
     "dataUpdate" data-update-fn})

#_(defn get-resources [tenant-conn tier]
    (reduce merge
            (map (fn [{:keys [title]}]
                   {title ((get policy-map title) tenant-conn tier)})
                 (select-policies tenant-conn))))

#_(defn all [tenant-conn]
    (let [plan (current-plan tenant-conn)]
      (response {"plan" plan
                 "resources" (get-resources tenant-conn (:tier plan))})))


#_(def policies ["numberOfExternaldatasets" "numberOfVisualisations"])

;; (defn tier-policy [v]
;;   (into {} (map (fn [p]
;;                   {p (get v p)})
;;                 policies)))

;; (tier-policy {"numberOfExternaldatasets" 5
;;               "numberOfVisualisations" 50})


(defn resource-usage
  [tenant-conn]
  (merge (count-visualisations tenant-conn {} {} {:identifiers identity})
         (select-external-datasets tenant-conn {} {} {:identifiers identity})))

(defn all [tenant-conn current-plan]
  (response {"plan" {:tier current-plan}
             "resources" (resource-usage tenant-conn)}))
