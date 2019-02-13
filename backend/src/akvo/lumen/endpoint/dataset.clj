(ns akvo.lumen.endpoint.dataset
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.dataset :as dataset]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.component.error-tracker :as error-tracker]
            [akvo.lumen.upload :as upload]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [upload-config import-config error-tracker tenant-manager]}]
  (context "/api/datasets" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]

      (GET "/" _
        (dataset/all tenant-conn))

      (POST "/" {:keys [tenant body jwt-claims] :as request}
        (dataset/create tenant-conn (merge import-config upload-config) error-tracker jwt-claims body))

      (context "/:id" [id]
        (GET "/" _
          (dataset/fetch tenant-conn id))

        (GET "/meta" _
          (dataset/fetch-metadata tenant-conn id))

        (DELETE "/" _
          (dataset/delete tenant-conn id))

        (PUT "/" {:keys [body]}
          (dataset/update-meta tenant-conn id body))

        (POST "/update" {:keys [body] :as request}
          (dataset/update tenant-conn (merge import-config upload-config) error-tracker id body))))))

(defmethod ig/init-key :akvo.lumen.endpoint.dataset/dataset  [_ opts]
  (endpoint opts))

(s/def ::upload-config ::upload/config)
(s/def ::flow-api-url string?)
(s/def ::keycloak ::keycloak/data)
(s/def ::import-config (s/keys :req-un [::flow-api-url ::keycloak]))
(s/def ::config (s/keys :req-un [::tenant-manager/tenant-manager
                                 ::error-tracker/error-tracker
                                 ::upload-config
                                 ::import-config]))

(defmethod integrant-key :akvo.lumen.endpoint.dataset/dataset [_]
  (s/cat :kw keyword?
         :config ::config))
