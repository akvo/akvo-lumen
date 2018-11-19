(ns akvo.lumen.component.caddisfly
  "akvo-caddisfly component support"
  (:require [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.java.io :as io]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]))

(defn extract-tests [json-schema]
  (->> (:tests json-schema)
       (reduce #(assoc % (:uuid %2) %2) {})))

(defn dev-caddisfly
  "caddisfly development version, so we can develop without internet connection"
  [options]
  {:pre [(:local-schema-uri options)]}
  options)

(defn caddisfly [options]
  {:pre [(:schema-uri options)]}
  options)

(defmethod ig/init-key :akvo.lumen.component.caddisfly/local  [_ {:keys [config] :as opts}]
  (let [{:keys [local-schema-uri] :as this} (dev-caddisfly (:caddisfly config))
        tests (-> local-schema-uri io/resource slurp (json/parse-string keyword) extract-tests)]
    (log/warn ::start "Using caddisfly LOCAL schema-uri:" local-schema-uri)
    (assoc this :schema tests)))

(defmethod ig/init-key :akvo.lumen.component.caddisfly/prod  [_ {:keys [config] :as opts}]
  (let [{:keys [schema-uri] :as this} (caddisfly (:caddisfly config))
        tests (-> schema-uri client/get :body (json/decode keyword) extract-tests)]
    (log/info ::start "Using caddisfly ONLINE schema-uri" schema-uri)
    (assoc this :schema tests)))

(defn get-caddisfly-schema
  [caddisfly caddisflyResourceUuid]
  (get (:schema caddisfly) caddisflyResourceUuid))
