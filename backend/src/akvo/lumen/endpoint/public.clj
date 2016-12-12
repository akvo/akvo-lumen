(ns akvo.lumen.endpoint.public
  (:require [cheshire.core :as json]
            [compojure.core :refer :all]
            [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.public :as public]))


(defn endpoint [{:keys [tenant-manager]}]
  (context "/s" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/:id" [id]
        (public/share tenant-conn id)))))
