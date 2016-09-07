(ns org.akvo.lumen.endpoint.dashboard
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.dashboard :as dashboard]
            [ring.util.response :refer [not-found response]]))


(defn endpoint [{:keys [tenant-manager]}]

  (context "/api/dashboards" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (response (dashboard/all tenant-conn)))

      (POST "/" {:keys [body]}
        (response (dashboard/create tenant-conn body)))

      (context "/:id" [id]

        (GET "/" _
          (if-let [d (dashboard/fetch tenant-conn id)]
            (response d)
            (not-found {:error "not found"})))

        (PUT "/" {:keys [body]}
          (response
           (dashboard/upsert tenant-conn id body)))

        (DELETE "/" _
          (if-let [r (dashboard/delete tenant-conn id)]
            (response r)
            (not-found {:error "not found"})))))))
