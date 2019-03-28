(ns akvo.lumen.endpoint.share
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.share :as share]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [integrant.core :as ig]))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/shares"
   ["" {:post {:parameters {:body map?}
               :handler (fn [{tenant :tenant
                              body :body}]
                          (share/fetch (p/connection tenant-manager tenant) body))}}]
   ["/:id" {:put {:parameters {:body map?
                               :path-params {:id string?}}
                  :handler (fn [{tenant :tenant
                                 body :body
                                 {:keys [id]} :path-params}]
                             (share/put (p/connection tenant-manager tenant) id body))}}]])

(defmethod ig/init-key :akvo.lumen.endpoint.share/share  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.share/share [_]
  (s/keys :req-un [::tenant-manager/tenant-manager] ))
