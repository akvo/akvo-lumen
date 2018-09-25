(ns akvo.lumen.component.error-tracker
  (:require [com.stuartsierra.component :as component]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))

(defrecord SentryErrorTracker [dsn]
  component/Lifecycle
  (start [this] this)
  (stop [this] this))

(defn sentry-error-tracker [options]
  (map->SentryErrorTracker options))

(defrecord LocalErrorTracker []
  component/Lifecycle
  (start [this] this)
  (stop [this] this))

(defn local-error-tracker [_]
  (->LocalErrorTracker))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/local  [_ opts]
  (println "init-key" _  :opts opts)
  (local-error-tracker nil))

(defmethod ig/halt-key! :akvo.lumen.component.error-tracker/local  [_ opts]
  (println "halt-key" _ opts))
