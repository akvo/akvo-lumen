(ns akvo.lumen.endpoint.share
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.share :as share]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/shares" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (POST "/" {:keys [body] :as request}
        (share/fetch tenant-conn body))

      (context "/:id" [id]
        (PUT "/" {:keys [body]}
          (share/put tenant-conn id body))))))

(defmethod ig/init-key :akvo.lumen.endpoint.share/share  [_ opts]
  (endpoint opts))
