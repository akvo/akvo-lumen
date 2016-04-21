(ns org.akvo.dash.endpoint.visualisation
  (:require [clojure.pprint :refer [pprint]]
            [compojure.core :refer :all]
            [hugsql.core :as hugsql]
            [org.akvo.dash.component.tenant-manager :refer [connection]]
            [org.akvo.dash.endpoint.util :refer [rr squuid]])
  (:import [java.sql SQLException]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/visualisation.sql")

(defn endpoint
  ""
  [{tm :tenant-manager :as config}]

  (context "/visualisations" []

    (GET "/" []
      (fn [{tenant :tenant :as request}]
        (rr (all-visualisations (connection tm
                                            tenant)))))
    (POST "/" []
      (fn [{:keys [:tenant :jwt-claims] :as request}]
        (try
          (let [resp (first (insert-visualisation
                             (connection tm tenant)
                             {:id     (squuid)
                              :name   (get-in request [:body "name"])
                              :spec   (get-in request [:body "spec"])
                              :author jwt-claims}))]
            (rr (dissoc resp :author)))
          (catch Exception e
            (pprint e)
            (when (isa? SQLException (type e))
              (pprint (.getNextException ^SQLException e)))
            (rr {:error e})))))

    (context "/:id" [id]

      (GET "/" []
        (fn [{tenant :tenant :as request}]
          (rr (dissoc (visualisation-by-id (connection tm tenant)
                                           {:id id})
                      :author)))))))
