(ns akvo.lumen.component.caddisfly
  "akvo-caddisfly component support"
  (:require [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.java.io :as io]
            [clojure.tools.logging :as log]
            [com.stuartsierra.component :as component]))

(defn extract-tests [json-schema]
  (->> (:tests json-schema)
       (reduce #(assoc % (:uuid %2) %2) {})))

(defrecord DevCaddisfly [local-schema-uri]
  component/Lifecycle
  (start [this]
    (let [tests (-> local-schema-uri io/resource slurp (json/parse-string keyword) extract-tests)]
      (log/warn ::start "Using caddisfly LOCAL schema-uri:" local-schema-uri)
      (assoc this :schema tests)))
  (stop [this]
    (dissoc this :schema)))

(defn dev-caddisfly
  "caddisfly development version, so we can develop without internet connection"
  [options]
  {:pre [(:local-schema-uri options)]}
  (map->DevCaddisfly options))

(defrecord Caddisfly [schema-uri]
  component/Lifecycle

  (start [this]
    (let [tests (-> schema-uri client/get :body (json/decode keyword) extract-tests)]
      (log/info ::start "Using caddisfly ONLINE schema-uri" schema-uri)
      (assoc this :schema tests)))

  (stop [this]
    (dissoc this :schema)))

(defn caddisfly [options]
  {:pre [(:schema-uri options)]}
  (map->Caddisfly options))
