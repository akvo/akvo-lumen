(ns akvo.lumen.endpoint.transformation
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.transformation :as t]
            [compojure.core :refer :all]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/transformations" {:keys [tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (context "/:dataset-id" [dataset-id]

        (POST "/transform" {:keys [body] :as request}
          (t/apply tenant-conn
                   dataset-id
                   {:type :transformation
                    :transformation body}))

        (POST "/undo" _
          (t/apply tenant-conn
                   dataset-id
                   {:type :undo}))))))
