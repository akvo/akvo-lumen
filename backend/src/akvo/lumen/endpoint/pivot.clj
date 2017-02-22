(ns akvo.lumen.endpoint.pivot
  (:require [akvo.lumen.component.tenant-manager :refer [connection]]
            [akvo.lumen.http :as http]
            [akvo.lumen.lib.pivot :as pivot]
            [cheshire.core :as json]
            [compojure.core :refer :all])
  (:import com.fasterxml.jackson.core.JsonParseException))

(defn endpoint [{:keys [tenant-manager config]}]
  (context "/api/pivot" {:keys [tenant query-params] :as request}
    (let-routes [tenant-conn (connection tenant-manager tenant)]
      (GET "/:id" [id]
        (if-let [query (get query-params "query")]
          (try
            (pivot/query tenant-conn id (json/parse-string query))
            (catch com.fasterxml.jackson.core.JsonParseException e
              (http/bad-request {:message (.getMessage e)})))
          (http/bad-request {:message "No query supplied"}))))))
