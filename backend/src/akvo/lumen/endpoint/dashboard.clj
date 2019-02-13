(ns akvo.lumen.endpoint.dashboard
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.dashboard :as dashboard]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]

  (context "/api/dashboards" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]

      (GET "/" _
        (dashboard/all tenant-conn))

      (POST "/" {:keys [body jwt-claims]}
        (dashboard/create tenant-conn body jwt-claims))

      (context "/:id" [id]

        (GET "/" _
          (dashboard/fetch tenant-conn id))

        (PUT "/" {:keys [body]}
          (dashboard/upsert tenant-conn id body))

        (DELETE "/" _
         (dashboard/delete tenant-conn id))))))

(defmethod ig/init-key :akvo.lumen.endpoint.dashboard/dashboard  [_ opts]
  (endpoint opts))

(defmethod integrant-key :akvo.lumen.endpoint.dashboard/dashboard [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager] )))
