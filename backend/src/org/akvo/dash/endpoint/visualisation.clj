(ns org.akvo.dash.endpoint.visualisation
  (:require [clojure.pprint :refer [pprint]]
            [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [org.akvo.dash.util :refer [squuid]]
            [ring.util.response :refer [response]])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/visualisation.sql")

(defn endpoint
  ""
  [{tm :tenant-manager}]

  (context "/visualisations" []

    (GET "/" {:keys [tenant]}
      (response (all-visualisations (connection tm tenant))))

    (POST "/" {:keys [tenant jwt-claims body]}
      (try
        (let [resp (first (insert-visualisation
                           (connection tm tenant)
                           {:id (squuid)
                            :dataset-id (get-in body ["spec" "sourceDataset"])
                            :name (get body "name")
                            :spec (get body "spec")
                            :author jwt-claims}))]
          (response (dissoc resp :author)))
        (catch Exception e
          (pprint e)
          (when (isa? SQLException (type e))
            (pprint (.getNextException ^SQLException e)))
          (response {:error e}))))

    (context "/:id" [id]

      (GET "/" {:keys [tenant]}
        (response (dissoc (visualisation-by-id (connection tm tenant)
                                               {:id id})
                          :author)))

      (DELETE "/" {:keys [tenant]}
        (delete-visualisation-by-id (connection tm tenant) {:id id})
        (response {:id id})))))
