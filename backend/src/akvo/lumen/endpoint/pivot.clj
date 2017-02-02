(ns akvo.lumen.endpoint.pivot
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.pivot :as pivot]
            [compojure.core :refer :all]))

(defn endpoint [{:keys [tenant-manager config]}]
  (context "/api/pivot" {:keys [body tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/:id" [id]
        (pivot/query tenant-conn id body)))))
