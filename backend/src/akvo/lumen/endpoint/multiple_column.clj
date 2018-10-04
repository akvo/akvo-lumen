(ns akvo.lumen.endpoint.multiple-column
  (:require [akvo.lumen.lib.multiple-column :as multiple-column]
            [cheshire.core :as json]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [caddisfly tenant-manager]}]
  (context "/api/multiple-column" {:keys [query-params] :as request}
           (GET "/" _
                (let [query (json/parse-string (get query-params "query") keyword)]
                  (multiple-column/details {:caddisfly caddisfly} (:multipleType query) (:multipleId query))))))

(defmethod ig/init-key :akvo.lumen.endpoint.multiple-column/multiple-column  [_ opts]
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.multiple-column/multiple-column  [_ opts])
