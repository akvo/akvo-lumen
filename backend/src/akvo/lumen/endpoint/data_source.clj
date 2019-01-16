(ns akvo.lumen.endpoint.data-source
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.data-source :as data-source]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/data-source/job-execution" {:keys [tenant]}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]
      (DELETE "/:id/status/:status" [id status]
              (data-source/delete tenant-conn id status)))))

(defmethod ig/init-key :akvo.lumen.endpoint.data-source/data-source  [_ opts]
  (endpoint opts))
