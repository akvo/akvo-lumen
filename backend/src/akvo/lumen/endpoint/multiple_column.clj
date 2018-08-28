(ns akvo.lumen.endpoint.multiple-column
  (:require [akvo.lumen.lib.multiple-column :as multiple-column]
            [cheshire.core :as json]
            [compojure.core :refer :all]))

(defn endpoint [{:keys [caddisfly tenant-manager]}]
  (context "/api/multiple-column" {:keys [query-params] :as request}
           (GET "/" _
                (let [query (json/parse-string (get query-params "query") keyword)]
                  (multiple-column/details {:caddisfly caddisfly} (:multipleType query) (:multipleId query))))))
