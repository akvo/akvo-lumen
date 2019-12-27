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

(defmethod ig/init-key :akvo.lumen.component.error-tracker/error-tracker
  [_ tracker]
  tracker)

(defrecord SentryErrorTracker [dsn]
  p/IErrorTracker
  (track [{dsn :dsn
           {:keys [namespaces] :as opts} :opts}
          error]
    (let [event-info (event-map error opts)]
      (->> (raven-interface/stacktrace event-info error namespaces)
           (raven/capture dsn)
           future))))

(defn sentry-error-tracker [dsn]
  (SentryErrorTracker. dsn))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/prod
  [_ {{:keys [dsn opts]} :tracker :as config}]
  (sentry-error-tracker dsn))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/wrap-sentry
  [_ {:keys [dsn opts] :as config}]
  #(raven-clj.ring/wrap-sentry % dsn {:extra opts}))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/config [_ opts]
  opts)

(defn- blue-green?
  [server-name]
  (and (string? server-name)
       (or (= "blue" server-name)
           (= "green" server-name))))
(s/def ::environment string?)
(s/def ::namespaces (s/coll-of string?))
(s/def ::release string?)
(s/def ::server-name blue-green?)
(s/def ::opts (s/keys :req-un [::namespaces]
                      :opt-un [::environment ::release ::server-name]))
(s/def ::dsn string?)
(s/def ::config (s/keys :req-un [::dsn ::opts]))


(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/wrap-sentry [_]
  ::config)

(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/config [_]
  ::config)

(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/prod
  [_]
  :akvo.lumen.component.error-tracker/config)

#_(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/error-tracker
  [_]
  (partial satisfies? p/IErrorTracker))
