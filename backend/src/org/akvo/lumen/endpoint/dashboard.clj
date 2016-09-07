(ns org.akvo.lumen.endpoint.dashboard
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.dashboard :as d]
            [ring.util.response :as resp]))


(defn endpoint [{:keys [tenant-manager]}]

  (context "/api/dashboards" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (resp/response (d/all-dashboards tenant-conn)))

      (POST "/" {:keys [body]}
        (resp/response (d/handle-new-dashboard tenant-conn body)))

      (context "/:id" [id]

        (GET "/" _
          (if-some [dashboard (d/dashboard-by-id tenant-conn {:id id})]
            (resp/response (d/handle-dashboard-by-id tenant-conn  id))
            (resp/not-found {:error "Not found"})))

        (PUT "/" {:keys [body]}
          (if-some [dashboard (d/dashboard-by-id tenant-conn {:id id})]
            (resp/response (d/persist-dashboard tenant-conn id body))
            (resp/not-found {:error "Not found"})))

        (DELETE "/" _
          (if-some [dashboard (d/dashboard-by-id tenant-conn {:id id})]
            (resp/response (d/handle-dashboard-delete tenant-conn id))
            (resp/not-found {:error "Not found"})))))))
