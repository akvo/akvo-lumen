(ns akvo.lumen.endpoint.transformation
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.transformation :as t]
            [clojure.walk :refer (keywordize-keys)]
            [akvo.lumen.transformation.engine :as engine]
            [clojure.set :refer (rename-keys)]
            [clojure.tools.logging :as log]
            [clojure.spec.alpha :as s]
            [compojure.core :refer :all]))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/transformations" {:keys [tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (context "/:dataset-id" [dataset-id]
        (POST "/transform" {:keys [body] :as request}
              (let [body (-> body keywordize-keys (rename-keys {:op ::engine/op}))
                    command {::t/type :transformation
                             :transformation body}]
                (t/apply tenant-conn dataset-id command)))

        (POST "/undo" _
          (t/apply tenant-conn
                   dataset-id
                   {::t/type :undo}))))))
