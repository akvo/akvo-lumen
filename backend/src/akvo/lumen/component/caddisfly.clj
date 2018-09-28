(ns akvo.lumen.component.caddisfly
  "akvo-caddisfly component support"
  (:require [cheshire.core :as json]
            [clj-http.client :as client]
            [clojure.java.io :as io]
            [integrant.core :as ig]
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
  {:pre [(boolean (:local-schema-uri options))]}
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
  {:pre [(boolean (:schema-uri options))]}
  (map->Caddisfly options))

(defmethod ig/init-key :akvo.lumen.component.caddisfly/local  [_ {:keys [config] :as opts}]
  (log/debug "init-key"  :opts (:caddisfly opts))
  (dev-caddisfly (:caddisfly config)))

(defmethod ig/halt-key! :akvo.lumen.component.caddisfly/local  [_ opts]
  (log/debug "halt-key"  opts))

(defmethod ig/init-key :akvo.lumen.component.caddisfly/prod  [_ {:keys [config] :as opts}]
  (log/warn "init-key :PROD"  :opts (:caddisfly opts))
  (component/start (caddisfly (:caddisfly config))))

(defmethod ig/halt-key! :akvo.lumen.component.caddisfly/prod  [_ opts]
  (log/debug "halt-key"  opts)
  (component/stop opts))
