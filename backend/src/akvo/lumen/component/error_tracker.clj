(ns akvo.lumen.component.error-tracker
  (:require [akvo.lumen.protocols :as p]
            [integrant.core :as ig]
            [raven-clj.core :as raven]
            [integrant.core :as ig]
            [raven-clj.ring]
            [raven-clj.interfaces :as raven-interface]))

(defrecord SentryErrorTracker [dsn])

(defn sentry-error-tracker [options]
  (map->SentryErrorTracker options))

(defrecord LocalErrorTracker [])

(defn local-error-tracker [_]
  (->LocalErrorTracker))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/local  [_ opts]
  (local-error-tracker nil))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/prod  [_ {:keys [config] :as opts}]
  (sentry-error-tracker (-> config :error-tracker)))

(defn event-map [error]
  (let [text (str (ex-data error))]
    {:extra {:ex-data (subs text 0 (min (count text) 4096))}
     :message (.getMessage error)}))

(extend-protocol p/IErrorTracker

  SentryErrorTracker
  (track [{:keys [dsn]} error]
    (let [app-namespaces ["org.akvo" "akvo"]
          event-map (event-map error)
          event-info (raven-interface/stacktrace event-map error app-namespaces)]
      (future (raven/capture dsn event-info))))

  LocalErrorTracker
  (track [this error]
    (println "LocalErrorTracker:" (.getMessage error))))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/wrap-sentry  [_ opts]
  raven-clj.ring/wrap-sentry)
