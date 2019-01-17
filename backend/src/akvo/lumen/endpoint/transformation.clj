(ns akvo.lumen.endpoint.transformation
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.transformation :as t]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [akvo.lumen.component.caddisfly :as caddisfly]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [integrant.core :as ig]))

(defn routes [{:keys [tenant-manager caddisfly] :as opts}]
  ["/transformations/:dataset-id"
   [["/transform"
      {:post {:parameters {:path-params {:dataset-id string?}
                           :body map?}
              :handler (fn [{tenant :tenant
                             body :body
                             {:keys [dataset-id]} :path-params}]
                         (t/apply {:tenant-conn (p/connection tenant-manager tenant) :caddisfly caddisfly}
                                  dataset-id
                                  {:type :transformation
                                   :transformation body}))}}]]
   [["/undo"
      {:post {:parameters {:path-params {:dataset-id string?}
                           :body map?}
              :handler (fn [{tenant :tenant
                             {:keys [dataset-id]} :path-params}]
                         (t/apply {:tenant-conn (p/connection tenant-manager tenant) :caddisfly caddisfly}
                                  dataset-id
                                  {:type :undo}))}}]]])


(defmethod ig/init-key :akvo.lumen.endpoint.transformation/transformation  [_ opts]
  (routes opts))

(defmethod integrant-key :akvo.lumen.endpoint.transformation/transformation [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::tenant-manager/tenant-manager
                                  ::caddisfly/caddisfly])))

(defmethod ig/init-key :akvo.lumen.endpoint.transformation/transformation  [_ opts]
  (routes opts))

