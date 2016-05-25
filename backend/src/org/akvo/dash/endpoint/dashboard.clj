(ns org.akvo.dash.endpoint.dashboard
  (:require [compojure.core :refer :all]
            [clojure.pprint :refer [pprint]]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [ring.util.response :as resp]))


(defn endpoint [{:keys [tenant-manager]}]

  (context "/api/dashboards" {:keys [params tenant] :as request}
    ;; (let [tenant-conn (connection tenant-manager tenant)])

    (GET "/" []
      (resp/response []))

    (POST "/" []
      (resp/response {:id "abc123"}))

    (context "/:id" [id]

      (GET "/" []
        (resp/response {:id id}))

      (PUT "/" []
        (resp/response {:id "New stuff or OK"}))

      (DELETE "/" []
        (resp/response {:status "OK"})))))
