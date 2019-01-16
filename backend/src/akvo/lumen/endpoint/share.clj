(ns akvo.lumen.endpoint.share
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.share :as share]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/shares" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]

      (POST "/" {:keys [body] :as request}
            (share/fetch tenant-conn body))
      
      (PUT "/:id" {:keys [body params]}
           (share/put tenant-conn (:id params) body)))))

(defmethod ig/init-key :akvo.lumen.endpoint.share/share  [_ opts]
  (endpoint opts))
