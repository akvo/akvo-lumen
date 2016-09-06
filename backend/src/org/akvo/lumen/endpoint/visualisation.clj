(ns org.akvo.lumen.endpoint.visualisation
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.visualisation :as visualisation]
            [ring.util.response :refer [not-found response status]]))


(defn ok?
  "Msg helper, true for successful message {:ok [...}.."
  [msg]
  (contains? msg :ok))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/visualisations" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (response (visualisation/all tenant-conn)))

      (POST "/" {:keys [jwt-claims body]}
        (response (visualisation/create tenant-conn body jwt-claims)))

      (context "/:id" [id]

        (GET "/" _
          (let [v (visualisation/fetch tenant-conn id)]
            (if v
              (response v)
              (not-found {:id id}))))

        (PUT "/" {:keys [jwt-claims body]}
          (visualisation/upsert tenant-conn (assoc body "id" id) jwt-claims)
          (response {:id id}))

        (DELETE "/" _
          (let [resp (visualisation/delete tenant-conn id)]
            (if (ok? resp)
              (response (-> :ok first resp))
              (-> (response (:error resp))
                  (status 400)))))))))
