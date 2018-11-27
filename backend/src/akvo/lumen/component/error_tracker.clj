(ns akvo.lumen.component.error-tracker
  (:require [integrant.core :as ig]
            [raven-clj.core :as raven]
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

(defprotocol IErrorTracker
  (track [this error]))

(defn event-map [error]
  (let [text (str (ex-data error))]
    {:extra {:ex-data (subs text 0 (min (count text) 4096))}
     :message (.getMessage error)}))

(extend-protocol IErrorTracker

  SentryErrorTracker
  (track [{:keys [dsn]} error]
    (let [app-namespaces ["org.akvo" "akvo"]
          event-map (event-map error)
          event-info (raven-interface/stacktrace event-map error app-namespaces)]
      (future (raven/capture dsn event-info))))

  LocalErrorTracker
  (track [this error]
    (println "LocalErrorTracker:" (.getMessage error))))
