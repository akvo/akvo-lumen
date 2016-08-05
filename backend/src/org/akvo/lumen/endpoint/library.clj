(ns org.akvo.lumen.endpoint.library
  (:require [compojure.core :refer :all]
            [ring.util.response :refer [response]]))

(defn endpoint [{{db :spec} :db}]
  (context "/api/library" []

    (GET "/" []
      (fn [request]
        (response {:dashboards []
                   :datasets []
                   :visualisations []})))))
