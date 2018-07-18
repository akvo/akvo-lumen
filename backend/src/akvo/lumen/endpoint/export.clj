(ns akvo.lumen.endpoint.export
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [cheshire.core :as json]
            [akvo.lumen.lib.export :as export]
            [compojure.core :refer :all]))

          
(defn endpoint [{:keys [config]}]
  (context "/api/export" {:keys [params tenant] :as request}

    (GET "/" {:keys [tenant query-params] :as request}
      (export/export (:exporter-api-url config) query-params))))
