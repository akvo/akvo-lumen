(ns akvo.lumen.utils.local-error-tracker
  (:require [akvo.lumen.protocols :as p]
            [akvo.lumen.component.error-tracker :as et]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Local client (print to std out)
;;;

(defrecord LocalErrorTracker [store]
  p/IErrorTracker
  (track [this error]
    (swap! (:store this) conj (et/event-map error))
    (log/info "LocalErrorTracker:" (.getMessage error))))

(defn local-error-tracker []
  (->LocalErrorTracker (atom [])))

(defmethod ig/init-key :akvo.lumen.utils.local-error-tracker/local  [_ opts]
  (local-error-tracker))

(defmethod ig/init-key :akvo.lumen.utils.local-error-tracker/local
  [_ _]
  (local-error-tracker))

(defmethod ig/pre-init-spec :akvo.lumen.utils.local-error-tracker/local
  [_]
  any?)
