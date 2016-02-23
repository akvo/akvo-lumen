(ns org.akvo.dash.endpoint.files
  (:require [compojure.core :refer [ANY]]
            [org.akvo.resumed :refer [make-handler]]))

(defn endpoint [config]
  (let [h (make-handler config)
        tmp (fn [req]
              (prn req)
              (h req))]
    (ANY "/files*" req (tmp req))))
