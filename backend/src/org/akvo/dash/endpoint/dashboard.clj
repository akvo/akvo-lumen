(ns org.akvo.dash.endpoint.dashboard
  (:require [compojure.core :refer :all]
            [clojure.pprint :refer [pprint]]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [org.akvo.dash.util :refer [squuid]]
            [ring.util.response :as resp]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/dashboard.sql")

(defn endpoint [{:keys [tenant-manager]}]

  (context "/api/dashboards" {:keys [params tenant] :as request}
    (let-routes [conn (connection tenant-manager tenant)]

      (GET "/" _
        (resp/response (all-dashboards conn)))

      (POST "/" _
        (resp/response (insert-dashboard conn {:id (squuid)
                                               :spec {}})))

      (context "/:id" [id]

        (GET "/" _
          (resp/response (dashboard-by-id conn {:id id})))

        (PUT "/" _
          (pprint "Update dashboard")
          (resp/response {:status "DID nothing"}))

        (DELETE "/" _
          (delete-dashboard-by-id conn {:id id})
          (resp/response {:status "OK"}))))))
