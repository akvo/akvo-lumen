(ns org.akvo.dash.endpoint.activity
  (:require [compojure.core :refer :all]
            ;; [clojure.pprint :refer [pprint]]
            [org.akvo.dash.endpoint.util :refer [rr]]
            [hugsql.core :as hugsql]))

;; (hugsql/def-db-fns "org/akvo/dash/endpoint/activity.sql")

(defn endpoint [{{db :spec} :db}]
  (context "/activities" []
    (GET "/" []
      (rr {:activities []}))))
