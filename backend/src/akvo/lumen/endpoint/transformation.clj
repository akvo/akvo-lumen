(ns akvo.lumen.endpoint.transformation
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.transformation :as t]
            [compojure.core :refer :all]
            [integrant.core :as ig]))

(defn endpoint [{:keys [tenant-manager caddisfly]}]
  (context "/api/transformations" {:keys [tenant] :as request}
    (let-routes [tenant-conn (p/connection tenant-manager tenant)]
      (context "/:dataset-id" [dataset-id]
        (POST "/:dataset-id/transform" {:keys [body params] :as request}
              (t/apply {:tenant-conn tenant-conn :caddisfly caddisfly}
                   (:dataset-id params)
                   {:type :transformation
                    :transformation body}))

        (POST "/:dataset-id/undo" [dataset-id]
              (t/apply {:tenant-conn tenant-conn :caddisfly caddisfly}
                   dataset-id 
                   {:type :undo}))))))

(defmethod ig/init-key :akvo.lumen.endpoint.transformation/transformation  [_ opts]
  (endpoint opts))
