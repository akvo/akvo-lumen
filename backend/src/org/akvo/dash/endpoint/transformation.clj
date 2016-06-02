(ns org.akvo.dash.endpoint.transformation
  (:require [compojure.core :refer :all]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [org.akvo.dash.transformation :as t]
            [ring.util.response :as response]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/transformations" {:keys [tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (context "/:id" [id]
        (POST "/" {:keys [body] :as request}
          (merge (response/response {})
            (t/schedule tenant-conn id (vec body))))))))
