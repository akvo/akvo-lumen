(ns org.akvo.dash.endpoint.public
  (:require [compojure.core :refer :all]
            [ring.util.response :refer [response]]
            )
  )

(defn endpoint [config]
  (context "/public" {:keys [params tenant] :as request}

    (GET "/" []
      (response {:id "abc123"})))

  )
