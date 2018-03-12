(ns akvo.lumen.boundary.error-tracker
  (:require [akvo.lumen.component.error-tracker]
            [raven-clj.core :as raven]
            [raven-clj.interfaces :as raven-interface])
  (:import [akvo.lumen.component.error_tracker SentryErrorTracker LocalErrorTracker]))

(defprotocol IErrorTracker
  (track [this error]))

(extend-protocol IErrorTracker

  SentryErrorTracker
  (track [{:keys [dsn]} error]
    (let [app-namespaces ["org.akvo" "akvo"]
          event-info (raven-interface/stacktrace
                      {:message (.getMessage error)
                       :extra {:ex-data (truncate-extra-str (str (ex-data error)))}}
                      error app-namespaces)]
      (future (raven/capture dsn event-info))))

  LocalErrorTracker
  (track [this error]
    (println "LocalErrorTracker:" (.getMessage error))))
