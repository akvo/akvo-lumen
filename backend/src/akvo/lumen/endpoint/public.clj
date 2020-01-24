(ns akvo.lumen.endpoint.public
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.public :as public]
            [cheshire.core :as json]
            [akvo.lumen.endpoint.dataset :as e.dataset]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [integrant.core :as ig]))

(s/def ::windshaft-url string?)

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.public/public [_]
  (s/keys :req-un [::tenant-manager/tenant-manager
                   ::windshaft-url] ))

(defn handler [{:keys [tenant-manager windshaft-url]}]
  (fn [{{:keys [id]} :path-params
        tenant :tenant
        headers :headers}]
    (let [tenant-conn (p/connection tenant-manager tenant)
          password (get headers "x-password")]
      (public/share tenant-conn windshaft-url id password))))

(defn routes [{:keys [tenant-manager] :as opts}]
  [["/:id"
     {:get {:parameters {:path-params {:id string?}}
            :handler (handler opts)}}]
   ["/dataset/:id/column/:column-name" (e.dataset/fetch-column-text-handler tenant-manager)]])

(defmethod ig/init-key :akvo.lumen.endpoint.public/public  [_ opts]
  (routes opts))
