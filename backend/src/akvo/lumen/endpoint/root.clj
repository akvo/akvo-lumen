(ns akvo.lumen.endpoint.root
  (:require [compojure.core :refer :all]
            [integrant.core :as ig]
            [ring.util.response :refer [response]]))

(defn endpoint [config]

  (GET "/api" _
    (fn [request]
      (let [base-url (str (-> request :scheme name)
                          "://" (:server-name request)
                          ":" (:server-port request)
                          (:uri request) "/")]
        (response
         {:help      (str "To access the API endpoints a valid authorization "
                          "header needs to be provided.")
          :tenant    (:tenant request)
          :resources {:datasets       (str base-url "datasets")
                      :shares         (str base-url "shares")
                      :visualisations (str base-url "visualisations")}})))))

(defmethod ig/init-key :akvo.lumen.endpoint.root/root  [_ opts]
  (endpoint opts))

(defmethod ig/halt-key! :akvo.lumen.endpoint.root/root  [_ opts])
