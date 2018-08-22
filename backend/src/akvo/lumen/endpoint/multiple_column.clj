(ns akvo.lumen.endpoint.multiple-column
  (:require [akvo.lumen.component.tenant-manager :refer [connection current-plan]]
            [akvo.lumen.lib.multiple-column :as multiple-column]
            [cheshire.core :as json]
            [compojure.core :refer :all]))


(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/multiple-column" {:keys [query-params tenant] :as request}
           (GET "/" _
                (let [query (json/parse-string (get query-params "query") keyword)]
                  (multiple-column/all (:subtype query) (:subtypeId query))))))
