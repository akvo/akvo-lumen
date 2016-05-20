(ns org.akvo.dash.endpoint.share
  (:require [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [clojure.java.jdbc :as jdbc]
            [clojure.pprint :refer [pprint]]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [ring.util.response :refer [response]])
  (:import java.util.UUID))

(hugsql/def-db-fns "org/akvo/dash/endpoint/share.sql")

(defn collection
  "Returns all shared item for tenant."
  [conn]
  (all-shares conn))


(defn share
  "Create or return share for item."
  [tenant-conn type id]
  (jdbc/with-db-transaction [tx tenant-conn]
    (let [existing-share (share-by-item-id tx {:visualisation-id (str id)})]
      (if (not (nil? existing-share))
        existing-share
        (insert-share tx {:id               (str (UUID/randomUUID))
                          :visualisation-id id
                          :spec             "{}"})))))

(defn end-share
  "Delete the share."
  [conn id]
  (delete-share-by-id conn {:id id}))

(defn endpoint [{:keys [tenant-manager config]}]
  (context "/shares" {:keys [params tenant] :as request}

    (GET "/" []
      (response {:index 0
                 :items (collection (connection tenant-manager tenant))}))

    (POST "/" {:keys [tenant body jwt-claims] :as request}
      (let [tenant-conn (connection tenant-manager tenant)
            item-id     (str (UUID/randomUUID))]
        (response (share tenant-conn "v" item-id))))))
