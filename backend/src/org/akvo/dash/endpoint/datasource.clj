(ns org.akvo.dash.endpoint.datasource
  "A Datasource describes a connection to data, it might be.."
  (:require
   [compojure.core :refer :all]
   [clojure.pprint :refer [pprint]]
   [org.akvo.dash.endpoint.util :as u]
   [hugsql.core :as hugsql]
   [cheshire.core :as json]))


(hugsql/def-db-fns "org/akvo/dash/endpoint/sql/datasource.sql")


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; API


(defn endpoint [{{db :spec} :db}]

  (context "/datasources" []

    (GET "/" [req]
      (u/fn->json-resp (all-datasources db)))

    (POST "/" [req]
      (try
        (let [id   (u/squuid)
              kind "LINK"
              resp {:datasource-id id
                    :import-id     id}]
          (insert-datasource db {:id id
                                 :kind kind
                                 :spec {:url "http://...csv"}})
          (u/val->json-resp resp))
        (catch Exception e
          (pprint e)
          (.printStackTrace (.getNextException e))
          (u/val->json-resp (str "Internal Server Error"
                                 e
                                 (.printStackTrace (.getNextException e)))
                            500))))

    (context "/:id" [id]

      (GET "/" [req]
        (u/fn->json-resp (datasource-by-id db
                                           {:id id}))))))
