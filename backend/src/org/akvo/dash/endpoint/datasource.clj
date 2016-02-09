(ns org.akvo.dash.endpoint.datasource
  "A Datasource describes a connection to data, it might be a link, or an other
  form of description on how to connect to the source data."
  (:require
   [clojure.pprint :refer [pprint]]
   [compojure.core :refer :all]
   [hugsql.core :as hugsql]
   [immutant.scheduling :as scheduling]
   [org.akvo.dash.endpoint.util :as u]
   [org.akvo.dash.import :as import])
  (:import
   org.postgresql.util.PSQLException))


(hugsql/def-db-fns "org/akvo/dash/endpoint/sql/datasource.sql")


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; API


(defn endpoint
  "Lives under /datasources.

  / GET
  Return all datasources

  / POST
  Creates new datasource & import db record. The import db record is set to
  pending, as a new import job is also scheduled to realize the import.

  /:id GET
  Return a specific datasource"
  [{{db :spec} :db}]

  (context "/datasources" []

    (GET "/" [req]
      (u/fn->json-resp (all-datasources db)))

    ;; 1.st case is link:
    ;; Recieve:
    ;; - user "abc123"
    ;; - kind "LINK"
    ;; - url "..."
    ;;
    ;; Do:
    ;; - Generate id
    ;; - Insert datasource
    ;; - Schedule import
    ;;
    ;; Return:
    ;; - datasource id
    ;; - import id

    (POST "/" [req]
      (let [user_id       "abc123"
            kind          "LINK"
            spec          {:url "http://localhost:3000/api/people.csv"}
            datasource-id (u/squuid)
            import-id     (u/squuid)
            resp          {:id        datasource-id
                           :import-id import-id}]
        (try
          (clojure.java.jdbc/with-db-transaction [tx db]
            (insert-datasource tx {:id   datasource-id
                                   :kind kind
                                   :spec spec})
            ;; (insert-import tx {:id     import-id
            ;;                    :status :pending})
            ;; (throw (Exception. "jdbc-transaction-fail"))
            )
          (scheduling/schedule #(import/job {:import-id import-id
                                  :kind      kind
                                  :spec      spec})
                    #_(in 10 :seconds))
          (u/val->json-resp resp)
          (catch PSQLException e
            ;; Log error
            (pprint e)
            (pprint (.printStackTrace (.getNextException e)))
            {:status  500
             :headers {"Content-Type" "text/plain"}
             :body    (.getMessage e)}))))


    (context "/:id" [id]

      (GET "/" [req]
        (u/fn->json-resp (datasource-by-id db
                                           {:id id}))))))
