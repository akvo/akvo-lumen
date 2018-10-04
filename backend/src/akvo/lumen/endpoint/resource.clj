(ns akvo.lumen.endpoint.resource
  (:require [akvo.lumen.component.tenant-manager :refer [connection current-plan]]
            [akvo.lumen.lib.resource :as resource]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/resources" {:keys [params tenant] :as request}
           (let-routes [tenant-conn (connection tenant-manager tenant)
                        current-plan (current-plan tenant-manager tenant)]

             (GET "/" _
                  (resource/all tenant-conn current-plan)))))

(defmethod ig/init-key :akvo.lumen.endpoint.resource/resource  [_ opts]
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.resource/resource  [_ opts])
