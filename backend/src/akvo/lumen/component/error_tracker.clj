(ns akvo.lumen.component.error-tracker
  (:require [com.stuartsierra.component :as component]))

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
