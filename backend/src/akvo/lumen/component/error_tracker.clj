(ns akvo.lumen.component.error-tracker
  (:require [akvo.lumen.protocols :as p]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [integrant.core :as ig]
            [integrant.core :as ig]
            [raven-clj.core :as raven]
            [raven-clj.interfaces :as raven-interface]
            [raven-clj.ring]))

(defn event-map
  ([error]
   (event-map error {}))
  ([error m]
   (let [text (str (ex-data error))]
     (assoc m
            :extra {:ex-data (subs text 0 (min (count text) 4096))}
            :message (.getMessage error)))))

(defrecord SentryErrorTracker [dsn opts]
  p/IErrorTracker
  (track [this error]
    (let [event-info (event-map error opts)]
      (->> (raven-interface/stacktrace event-info error (:namespaces opts))
           (raven/capture dsn)
           future))))

(defn sentry-error-tracker [dsn opts]
  (SentryErrorTracker. dsn opts))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/prod
  [_ {{:keys [dsn opts]} :tracker :as config}]
  (sentry-error-tracker dsn opts))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/wrap-sentry
  [_ {:keys [dsn opts] :as config}]
  #(raven-clj.ring/wrap-sentry % dsn opts))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/config [_ opts]
  opts)

(s/def ::dsn string?)
(s/def ::environment string?)
(s/def ::namespaces (s/coll-of string?))
(s/def ::release string?)
(s/def ::server-name string?)
(s/def ::opts
  (s/keys :req-un [::namespaces]
          :opt-un [::environment ::release ::server-name]))

(s/def ::config (s/keys :req-un [::dsn ::opts]))

(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/config [_]
  ::config)

(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/wrap-sentry [_]
  ::config)

(s/def :akvo.lumen.component.error-tracker/error-tracker (partial satisfies? p/IErrorTracker))

(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/prod
  [_]
  (s/keys :req-un [::dsn ::opts]))
