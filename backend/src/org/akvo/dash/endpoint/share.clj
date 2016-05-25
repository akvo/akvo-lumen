(ns org.akvo.dash.endpoint.share
  (:require [compojure.core :refer :all]
            [crypto.random :as random]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [ring.util.response :refer [response]]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/share.sql")

(defn collection
  "Returns all shared item for tenant."
  [conn]
  (all-shares conn))

(defn share-visualisation [tenant-conn visualisation-id]
  (first (insert-visualisation-share tenant-conn
                                     {:id (random/url-part 8)
                                      :visualisation-id visualisation-id})))

(defn end-share
  "Delete the share."
  [conn id]
  (delete-share-by-id conn {:id id}))

(defn endpoint [{:keys [tenant-manager config]}]
  (context "/api/shares" {:keys [params tenant] :as request}

    (GET "/" []
      (response {:index 0
                 :items (collection (connection tenant-manager tenant))}))

    (POST "/" {:keys [tenant body] :as request}
      (let [tenant-conn (connection tenant-manager tenant)]
        (response (share-visualisation tenant-conn
                                       (get body "visualisationId")))))))
