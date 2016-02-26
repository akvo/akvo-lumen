(ns org.akvo.dash.endpoint.visualisation
  (:require
   [compojure.core :refer :all]
   [hugsql.core :as hugsql]
   [org.akvo.dash.endpoint.util :refer [rr squuid]]))


(hugsql/def-db-fns "org/akvo/dash/endpoint/visualisation.sql")

(defn str->uuid ;; unnecessary?
  "Converts a string to a UUID.
  This will thrown on invalid uuid!"
  [s]
  (java.util.UUID/fromString s))

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
            (prn  (.getNextException e))))))

    (context "/:id" [id]

      (GET "/" []
        (fn [req]
          (try
            (let [res (visualisation-by-id db
                                           {:id (str->uuid id)}) ]
              (if (nil? res)
                (rr {:error "Not Found"} {:status 404})
                (rr res )))
            (catch Exception e
              (prn e)
              (prn (.getNextException e))
              (rr {:error (.getNextException e)} {:status 500})))))

      (PUT "/" []
        (fn [req]
          (insert-visualisation-data db
                                     {:id            (squuid)
                                      :visualisation (str->uuid id)
                                      :name          (get-in req [:body "name"])
                                      :spec          (get-in req [:body "spec"])})
          (rr {:status "OK"})))

      (DELETE "/" []
        (fn [req]
          (try
            (delete-visualisation db
                                  {:id            (squuid)
                                   :visualisation (str->uuid id)
                                   :name          ""
                                   :spec          {}
                                   :enabled       false})
            (rr {:status "OK"})
            (catch Exception e
              (prn e)
              (prn (.getNextException e))
              (rr {"error" (.getNextException e)} {:status 500}))))))))
