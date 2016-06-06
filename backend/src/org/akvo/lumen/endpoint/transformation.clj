(ns org.akvo.lumen.endpoint.transformation
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.transformation :as t]
            [ring.util.response :as response]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/transformations" {:keys [tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (context "/:id" [id]
        (POST "/" {:keys [body] :as request}
          (merge (response/response {})
            (t/schedule tenant-conn id (vec body))))))))
