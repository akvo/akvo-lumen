(ns org.akvo.dash.endpoint.public
  (:require [compojure.core :refer :all]
            [clojure.pprint :refer  [pprint]]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [org.akvo.dash.endpoint.dataset :refer [find-dataset]]
            [org.akvo.dash.endpoint.visualisation :refer [visualisation]]
            [ring.util.response :refer [not-found response]]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/public.sql")


(defn get-share
  [conn id]
  (try
    (if-let [r (public-by-id conn {:id id})]
      r)
    (catch Exception e
      (pprint e)
      (pprint (.getNextException e)))))


(defn prepare-response
  [conn share]
  (let [v (visualisation conn (:visualisation_id share))]
    {:type "visualisation"
     :visualisation v
     :data (find-dataset conn (:datasetId v))}))


(defn endpoint [{tm :tenant-manager :as config}]

  (context "/public" {:keys [params tenant] :as request}

    (GET "/:id" [id]
      (let [conn (connection tm tenant)
            share (get-share conn id)]
        (if (nil? share)
          (not-found {:error 404
                      :message (str "No public share with id: " id)})
          (response (prepare-response conn share)))))))
