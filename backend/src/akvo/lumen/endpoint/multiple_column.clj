(ns akvo.lumen.endpoint.multiple-column
  (:require [akvo.lumen.lib.multiple-column :as multiple-column]
            [akvo.lumen.specs.components :refer (integrant-key)]
            [clojure.spec.alpha :as s]
            [akvo.lumen.component.caddisfly :as caddisfly]
            [cheshire.core :as json]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [caddisfly]}]
  (context "/api/multiple-column" {:keys [query-params] :as request}
           (GET "/" _
                (let [query (json/parse-string (get query-params "query") keyword)]
                  (multiple-column/details {:caddisfly caddisfly} (:multipleType query) (:multipleId query))))))

(defmethod ig/init-key :akvo.lumen.endpoint.multiple-column/multiple-column  [_ opts]
  (endpoint opts))


(defmethod integrant-key :akvo.lumen.endpoint.multiple-column/multiple-column [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::caddisfly/caddisfly])))
