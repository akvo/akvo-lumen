(ns akvo.lumen.endpoint.share
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.share :as share]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/shares" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]

      (POST "/" {:keys [body] :as request}
        (share/fetch tenant-conn body))

      (context "/:id" [id]
        (PUT "/" {:keys [body]}
          (share/put tenant-conn id body))))))

(defmethod ig/init-key :akvo.lumen.endpoint.share/share  [_ opts]
  (endpoint opts))

(defmethod integrant-key :akvo.lumen.endpoint.share/share [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager] )))
