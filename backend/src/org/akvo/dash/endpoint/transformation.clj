(ns org.akvo.dash.endpoint.transformation
  (:require [compojure.core :refer :all]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [org.akvo.dash.transformation :as t]))

(defn endpoint [{:keys [tenant-manager config]}]
  (context "/api/transformations" {:keys [tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (context "/:id" [id]
        (POST "/" {:keys [body] :as request}
          (t/schedule tenant-conn id body))))))
