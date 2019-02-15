(ns akvo.lumen.endpoint.data-source
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.data-source :as data-source]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/data-source/job-execution" {:keys [tenant]}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]
      (context "/:id/status/:status" [id status]
               (DELETE "/" _
                       (data-source/delete tenant-conn id status))))))

(defmethod ig/init-key :akvo.lumen.endpoint.data-source/data-source  [_ opts]
  (endpoint opts))

(defmethod integrant-key :akvo.lumen.endpoint.data-source/data-source [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager] )))
