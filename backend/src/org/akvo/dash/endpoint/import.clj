(ns org.akvo.dash.endpoint.import
  (:require [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.import :as import]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [ring.util.response :as response]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/import.sql")

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/imports" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (response/response (all-imports tenant-conn)))

      (GET "/:id" [id]
        (if-let [status (import/status tenant-conn id)]
          (response/response status)
          (response/not-found {"importId" id}))))))
