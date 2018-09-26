(ns akvo.lumen.endpoint.public
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.lib.public :as public]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]
            [cheshire.core :as json]
            [compojure.core :refer :all]))


(defn endpoint [{:keys [tenant-manager config]}]
  (context "/share" {:keys [params tenant headers] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/:id" [id]
        (let [password (get headers "x-password")]
          (public/share tenant-conn config id password))))))


(defmethod ig/init-key :akvo.lumen.endpoint.public  [_ opts]
  (log/debug "init-key" :akvo.lumen.endpoint.public :opts opts)
  endpoint)

(defmethod ig/halt-key! :akvo.lumen.endpoint.public  [_ opts]
  (log/debug "halt-key" :akvo.lumen.endpoint.public opts))
