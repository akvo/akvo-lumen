(ns org.akvo.dash.endpoint.datasource
  "A Datasource describes a connection to data, it might be.."
  (:require
   [compojure.core :refer :all]
   [org.akvo.dash.endpoint.utils :as u]))

(def ^{:no-doc true} collection
  {:datasorces [{:id "a"} {:id "b"}]})

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; API

(defn endpoint [config]
  (context "/datasource" []

    (GET "/" []
      (u/render collection))

    (context "/:id" [id]
      (u/render id))))
