(ns akvo.lumen.boundary.error-tracker
  (:require [akvo.lumen.component.error-tracker]
            [raven-clj.core :as raven])
  (:import [akvo.lumen.component.error_tracker SentryErrorTracker LocalErrorTracker]))

(defprotocol IErrorTracker
  (track [this error]))

(extend-protocol IErrorTracker

  SentryErrorTracker
  (track [{:keys [dsn]} error]
    (raven/capture dsn error))

  LocalErrorTracker
  (track [this error]
    (println "LocalErrorTracker:" (.getMessage error))))
