(ns org.akvo.dash.endpoint.activity
  (:require [compojure.core :refer :all]
            [hugsql.core :as hugsql]))

(hugsql/def-db-fns "org/akvo/dash/endpoint/sql/activity.sql")

(defn endpoint [{{db :spec} :db}]
  (context "/activities" []
    (GET "/" []
      (try
        (let [;; r (insert-activity db
              ;;                    {:user_id "abc-123"
              ;;                     :event   {:key "value"}})
              r (activity-by-id db
                                {:id 7})]
          {:status  200
           :headers {"Content-Type" "text/plain"}
           :body    (str r)})
        (catch Exception e
          ;; (pprint e)
          ;; (.printStackTrace (.getNextException e))
          {:status 500
           :headers {"Content-Type" "text/plain"}
           :body (str "Yikes (500): \n" e)})))))
