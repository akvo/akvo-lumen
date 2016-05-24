(ns org.akvo.dash.endpoint.import
  (:require [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.import :as import]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [ring.util.response :as response]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/import.sql")

(defn endpoint
  ""
  [{tm :tenant-manager}]
  (context "/api/imports" {:keys [params tenant] :as request}

    (GET "/" []
      (response/response (all-imports (connection tm tenant))))

    (GET "/:id" [id]
      (if-let [status (import/status (connection tm tenant) id)]
        (response/response status)
        (response/not-found {"importId" id})))))
