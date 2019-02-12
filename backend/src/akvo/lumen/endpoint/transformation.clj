(ns akvo.lumen.endpoint.transformation
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.transformation :as t]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [akvo.lumen.component.caddisfly :as caddisfly]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager caddisfly]}]
  (context "/api/transformations" {:keys [tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]
      (context "/:dataset-id" [dataset-id]
        (POST "/transform" {:keys [body] :as request}
              (t/apply {:tenant-conn tenant-conn :caddisfly caddisfly}
                   dataset-id
                   {:type :transformation
                    :transformation body}))

        (POST "/undo" _
              (t/apply {:tenant-conn tenant-conn :caddisfly caddisfly}
                   dataset-id
                   {:type :undo}))))))

(defmethod ig/init-key :akvo.lumen.endpoint.transformation/transformation  [_ opts]
  (endpoint opts))

(defmethod integrant-key :akvo.lumen.endpoint.transformation/transformation [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager
                                  ::caddisfly/caddisfly])))
