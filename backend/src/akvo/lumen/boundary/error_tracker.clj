(ns akvo.lumen.boundary.error-tracker
  (:require [akvo.lumen.component.error-tracker]
            [raven-clj.core :as raven]
            [raven-clj.interfaces :as raven-interface])
  (:import [akvo.lumen.component.error_tracker SentryErrorTracker LocalErrorTracker]))

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
