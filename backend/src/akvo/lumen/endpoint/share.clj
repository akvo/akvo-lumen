(ns akvo.lumen.endpoint.share
  (:require [compojure.core :refer :all]
            [akvo.lumen.component.tenant-manager :refer [connection]]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]
            [akvo.lumen.lib.share :as share]))


(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/shares" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (POST "/" {:keys [body] :as request}
        (share/fetch tenant-conn body))

      (context "/:id" [id]
        (PUT "/" {:keys [body]}
          (share/put tenant-conn id body))))))


(defmethod ig/init-key :akvo.lumen.endpoint.share  [_ opts]
  (log/debug "init-key" :akvo.lumen.endpoint.share :opts opts)
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.share  [_ opts]
  (log/debug "halt-key" :akvo.lumen.endpoint.share opts))
