(ns akvo.lumen.endpoint.transformation
  (:require [compojure.core :refer :all]
            [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.transformation :as t]
            [ring.util.response :as response]))

(defn endpoint [{:keys [tenant-manager transformation-engine]}]
  (context "/api/transformations" {:keys [tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (context "/:dataset-id" [dataset-id]

        (POST "/transform" {:keys [body] :as request}
          (merge (response/response {})
                 (t/schedule tenant-conn
                             transformation-engine
                             dataset-id
                             {:type :transformation
                              :transformation body})))

        (POST "/undo" _
          (merge (response/response {})
                 (t/schedule tenant-conn
                             transformation-engine
                             dataset-id
                             {:type :undo})))))))
