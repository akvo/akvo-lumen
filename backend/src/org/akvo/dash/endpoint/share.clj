(ns org.akvo.dash.endpoint.share
  (:require [clojure.string :as string]
            [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [ring.util.response :refer [response]])
  (:import java.util.Base64
           java.security.SecureRandom))

(hugsql/def-db-fns "org/akvo/dash/endpoint/share.sql")

(defn random-url-safe-string
  "Returns a url safe random string of provided size. Defaults to size 8 bytes."
  ([] (random-url-safe-string 8))
  ([size]
   (let [random-bytes (let [seed (byte-array size)]
                        (.nextBytes (SecureRandom.) seed)
                        seed)
         encoder      (.withoutPadding (Base64/getUrlEncoder))]
     (String. (.encode encoder random-bytes)))))

(defn collection
  "Returns all shared item for tenant."
  [conn]
  (all-shares conn))

(defn share-visualisation [tenant-conn visualisation-id]
  (first (insert-visualisation-share tenant-conn
                                     {:id (random-url-safe-string)
                                      :visualisation-id visualisation-id})))

(defn share-dashboard [tenant-conn dashboard-id]
  (first (insert-dashboard-share tenant-conn
                                 {:id (random-url-safe-string)
                                  :dashboard-id dashboard-id})))

(defn end-share
  "Delete the share."
  [conn id]
  (delete-share-by-id conn {:id id}))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/shares" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (response (collection tenant-conn)))

      (POST "/" {:keys [tenant body] :as request}
        (if (contains? body "visualisationId")
          (response (share-visualisation tenant-conn
                                         (get body "visualisationId")))
          (response (share-dashboard tenant-conn
                                     (get body "dashboardId"))))))))
