(ns org.akvo.lumen.endpoint.public
  (:require [cheshire.core :as json]
            [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.public :as public]))


(defn endpoint [{:keys [tenant-manager]}]
  (context "/s" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/:id" [id]
        (public/share tenant-conn id)))))
