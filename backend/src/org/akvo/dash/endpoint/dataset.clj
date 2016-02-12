(ns org.akvo.dash.endpoint.dataset
  "Dataset..."
  (:require
   [compojure.core :refer :all]
   [org.akvo.dash.endpoint.util :refer [render]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; WIP helpers while we structure the API

(def collection
  {:id     "abc123"
   :schema [{:header "Column 1"
             :type   "NUMBER"}
            {:header "Column 2"
             :type   "STRING"}
            {:header "Column 3"
             :type   "DATE"
             :format "dd-mm-yyyy"}]
   :data   [[1, "foo", 1454036337],
            [2, "bar", 1454036370],
            [3, "baz", 1454036402]]})


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; API

(defn endpoint [config]

  (context "/datasets" []

    (POST "/" []
      {:status 200
       :headers {"Content-Type" "application/json"}
       :body "{\"dataset\": {}}"})

    (GET "/" []
      (render collection))

    (context "/:id" [id]
      (GET "/" []
        (render id)))))
