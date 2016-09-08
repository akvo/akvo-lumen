(ns org.akvo.lumen.endpoint.share
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.share :as share]))


(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/shares" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (POST "/" {:keys [body] :as request}
        (share/fetch tenant-conn body)))))
