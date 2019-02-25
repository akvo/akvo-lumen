(ns akvo.lumen.endpoint.multiple-column
  (:require [akvo.lumen.lib.multiple-column :as multiple-column]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.caddisfly :as caddisfly]
            [cheshire.core :as json]
            [integrant.core :as ig]))

(defn handler [{:keys [caddisfly] :as opts}]
  (fn [{query-params :query-params
        :as request}]
    (let [query (json/parse-string (get query-params "query") keyword)]
      (multiple-column/details opts (:multipleType query) (:multipleId query)))))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/multiple-column"
   {:get {:handler (handler opts)}}])

(defmethod ig/init-key :akvo.lumen.endpoint.multiple-column/multiple-column  [_ opts]
  (routes opts))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.multiple-column/multiple-column [_]
  (s/keys :req-un [::caddisfly/caddisfly]))
