(ns akvo.lumen.endpoint.aggregation
  (:require [akvo.lumen.auth :as auth]
            [akvo.lumen.component.tenant-manager :as tenant-manager]
            [akvo.lumen.endpoint.commons.http :as http]
            [akvo.lumen.lib.aggregation :as aggregation]
            [akvo.lumen.protocols :as p]
            [cheshire.core :as json]
            [clojure.spec.alpha :as s]
            [integrant.core :as ig])
  (:import [com.fasterxml.jackson.core JsonParseException]))

(defmethod ig/pre-init-spec :akvo.lumen.endpoint.aggregation/aggregation [_]
  (s/keys :req-un [::tenant-manager/tenant-manager] ))

(defn handler [{:keys [tenant-manager] :as opts}]
  (fn [{{:keys [dataset-id visualisation-type]} :path-params
        query-params :query-params
        tenant :tenant}]
    (let [tenant-conn (p/connection tenant-manager tenant)]
      (if-let [query (get query-params "query")]
        (try
          (aggregation/query tenant-conn
                             dataset-id
                             visualisation-type
                             (json/parse-string query keyword))
          (catch JsonParseException e
            (http/bad-request {:message (.getMessage e)})))
        (http/bad-request {:message "No query supplied"})))))

(defn routes [{:keys [tenant-manager] :as opts}]
  ["/aggregation"
   ["/:dataset-id/:visualisation-type" {:middleware [(auth/authenticate-dataset :dataset-id)]}
    ["" {:get {:parameters {:path-params {:dataset-id string?
                                          :visualisation-type string?}}
               :handler (handler opts)}}]]])

(defmethod ig/init-key :akvo.lumen.endpoint.aggregation/aggregation  [_ opts]
  (routes opts))

