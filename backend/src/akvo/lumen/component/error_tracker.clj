(ns akvo.lumen.component.error-tracker
  (:require [integrant.core :as ig]))

(defrecord SentryErrorTracker [dsn])

(defn sentry-error-tracker [options]
  (map->SentryErrorTracker options))

(defrecord LocalErrorTracker [])

(defn local-error-tracker [_]
  (->LocalErrorTracker))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/local  [_ opts]
  (local-error-tracker nil))

(defmethod ig/halt-key! :akvo.lumen.component.error-tracker/local  [_ opts]
  opts)

(defmethod ig/init-key :akvo.lumen.component.error-tracker/prod  [_ {:keys [config] :as opts}]
  (sentry-error-tracker (-> config :error-tracker)))

(defmethod ig/halt-key! :akvo.lumen.component.error-tracker/prod  [_ opts]
  opts)
