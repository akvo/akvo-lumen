(ns org.akvo.lumen.endpoint.share
  (:require [compojure.core :refer :all]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.lib.share :as share]
            [ring.util.response :refer [response]]))


(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/shares" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (POST "/" {:keys [tenant body] :as request}
        (if (contains? body "visualisationId")
          (response (share/visualisation tenant-conn
                                         (get body "visualisationId")))
          (response (share/dashboard tenant-conn
                                     (get body "dashboardId"))))))))
