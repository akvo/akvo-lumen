(ns org.akvo.dash.endpoint.visualisation
  (:require
   [compojure.core :refer :all]
   [hugsql.core :as hugsql]
   [org.akvo.dash.endpoint.util :refer [rr squuid]]))


(hugsql/def-db-fns "org/akvo/dash/endpoint/visualisation.sql")


(defn endpoint
  "/visualisations

  / GET
  Return the visualisation collection.
  ;; Twiiter style
  ;; :count       20
  ;; :cursor      1
  ;; :next_cursor 21
  ;; Factual style
  ;; :offset      1
  ;; :limit       20
  ;; :previous_cursor -1
  ;; ?


  / POST
  Creates a visualisation

  ...
  "
  [{{db :spec} :db}]

  (context "/visualisations" []

    (GET "/" []
      (rr {:entities (all-visualisations db)}))

    (POST "/" []
      (fn [req]
        (try
          (let [visualisation      {:id (squuid)}
                visualidation-data {:id            (squuid)
                                    :visualisation (:id visualisation)
                                    :name          (get-in req [:body "name"])
                                    :spec          (get-in req [:body "spec"])}
                res                (clojure.java.jdbc/with-db-transaction [tx db]
                                     {:v  (insert-visualisation tx
                                                                visualisation)
                                      :vd (insert-visualisation-data tx
                                                                     visualidation-data)})]
            (rr {:id   (:id visualisation)
                 :name (:name visualidation-data)
                 :spec (:spec visualidation-data)}))
          (catch Exception e
            (prn e)
            (prn  (.getNextException e))))))))
