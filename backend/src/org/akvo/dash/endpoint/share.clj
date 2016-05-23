(ns org.akvo.dash.endpoint.share
  (:require [clojure.java.jdbc :as jdbc]
            [clojure.pprint :refer [pprint]]
            [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [org.akvo.dash.util :refer (squuid)]
            [ring.util.response :refer [response]])
  (:import java.util.UUID))

(hugsql/def-db-fns "org/akvo/dash/endpoint/share.sql")

(defn collection
  "Returns all shared item for tenant."
  [conn]
  (all-shares conn))


(defn share-visualisation [tenant-conn visualisation-id]
  (first (insert-visualisation-share tenant-conn
                                     {:id (str (squuid))
                                      :visualisation-id visualisation-id})))

(defn end-share
  "Delete the share."
  [conn id]
  (delete-share-by-id conn {:id id}))

(defn endpoint [{:keys [tenant-manager config]}]
  (context "/shares" {:keys [params tenant] :as request}

    (GET "/" []
      (response {:index 0
                 :items (collection (connection tenant-manager tenant))}))

    (POST "/" {:keys [tenant body] :as request}
      (let [tenant-conn (connection tenant-manager tenant)]
        (response (share-visualisation tenant-conn
                                       (get body "visualisationId")))))))
