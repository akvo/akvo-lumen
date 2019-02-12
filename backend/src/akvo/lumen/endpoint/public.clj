(ns akvo.lumen.endpoint.public
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.public :as public]
            [cheshire.core :as json]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager windshaft-url]}]
  (context "/share" {:keys [params tenant headers] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]

      (GET "/:id" [id]
        (let [password (get headers "x-password")]
          (public/share tenant-conn windshaft-url id password))))))

(defmethod ig/init-key :akvo.lumen.endpoint.public/public  [_ opts]
  (endpoint opts))

(s/def ::windshaft-url string?)

(defmethod integrant-key :akvo.lumen.endpoint.public/public [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager
                                  ::windshaft-url] )))
