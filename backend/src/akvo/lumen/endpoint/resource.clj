(ns akvo.lumen.endpoint.resource
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.resource :as resource]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/resources" {:keys [params tenant] :as request}
           (let-routes [tenant-conn (p/connection tenant-manager tenant)
                        current-plan (p/current-plan tenant-manager tenant)]

             (GET "/" _
                  (resource/all tenant-conn current-plan)))))

(defmethod ig/init-key :akvo.lumen.endpoint.resource/resource  [_ opts]
  (endpoint opts))

(defmethod integrant-key :akvo.lumen.endpoint.resource/resource [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager] )))
