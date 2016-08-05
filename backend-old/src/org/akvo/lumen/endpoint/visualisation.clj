(ns org.akvo.lumen.endpoint.visualisation
  (:require [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.lumen.component.tenant-manager :refer [connection]]
            [org.akvo.lumen.util :refer [squuid]]
            [ring.util.response :refer [not-found response]])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "org/akvo/lumen/endpoint/visualisation.sql")


(defn visualisation
  ""
  [conn id]
  (dissoc (visualisation-by-id conn
                               {:id id}
                               {}
                               {:identifiers identity})
          :author))

(defn endpoint [{:keys [tenant-manager]}]
  (context "/api/visualisations" {:keys [params tenant] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]

      (GET "/" _
        (response (all-visualisations tenant-conn
                                      {}
                                      {}
                                      {:identifiers identity})))

      (POST "/" {:keys [jwt-claims body]}
        (try
          (let [id (squuid)
                resp (first (upsert-visualisation
                             tenant-conn
                             {:id id
                              :dataset-id (get body "datasetId")
                              :type (get body "visualisationType")
                              :name (get body "name")
                              :spec (get body "spec")
                              :author jwt-claims}))]
            (response (assoc body
                             "id" id
                             "status" "OK"
                             "created" (:created resp)
                             "modified" (:modified resp))))
          (catch Exception e
            (.printStackTrace e)
            (when (isa? SQLException (type e))
              (.printStackTrace (.getNextException ^SQLException e)))
            (response {:error e}))))

      (context "/:id" [id]

        (GET "/" _
          (if-let [v (visualisation-by-id tenant-conn
                                          {:id id}
                                          {}
                                          {:identifiers identity})]
            (response (dissoc v :author))
            (not-found {:id id})))

        (PUT "/" {:keys [jwt-claims body]}
          (upsert-visualisation tenant-conn
            {:id id
             :dataset-id (get body "datasetId")
             :type (get body "visualisationType")
             :name (get body "name")
             :spec (get body "spec")
             :author jwt-claims})
          (response {:id id}))

        (DELETE "/" _
          (try
            (delete-visualisation-by-id tenant-conn {:id id})
            (response {:id id})
            (catch Exception e
              (.printStackTrace e)
              (when (isa? SQLException (type e))
                (.printStackTrace (.getNextException ^SQLException e)))
              (response {:error e}))))))))
