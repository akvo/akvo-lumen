(ns org.akvo.dash.endpoint.import
  (:require [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.import :as import]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [ring.util.response :as response]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/import.sql")

(defn endpoint
  ""
  [{tm :tenant-manager :as config}]
  (context "/imports" []

    (GET "/" []
      (fn [{tenant :tenant :as request}]
        (let [tenant-conn (connection tm tenant)]
          (response/response (all-imports tenant-conn)))))

    (GET "/:id" {:keys [params tenant]}
      (if-let [status (import/status (connection tm tenant)
                                     (:id params))]
        (response/response status)
        (response/not-found {"importId" (:id params)})))))
