(ns akvo.lumen.component.error-tracker
  (:require [akvo.lumen.protocols :as p]
            [integrant.core :as ig]
            [raven-clj.core :as raven]
            [integrant.core :as ig]
            [raven-clj.ring]
            [clojure.spec.alpha :as s]
            [raven-clj.interfaces :as raven-interface]))

(defn blue-green?
  [server-name]
  (and (string? server-name)
       (or (= "blue" server-name)
           (= "green" server-name))))

(s/def ::dsn string?)

(s/def ::environment string?)
(s/def ::namespaces (s/coll-of string?))
(s/def ::release string?)
(s/def ::server-name blue-green?)

(s/def ::opts
  (s/keys :req-un [::namespaces]
          :opt-un [::environment ::release ::server-name]))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/config-local [_ config]
  config)

(s/def ::config-local
  (s/keys :req-un [::opts]))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/config-prod [_ config]
  config)

(s/def ::config-prod
  (s/keys :req-un [::dsn ::opts]))

(defrecord SentryErrorTracker [dsn])

(defn sentry-error-tracker [dsn]
  (SentryErrorTracker. dsn))

(defrecord LocalErrorTracker [])

(defn local-error-tracker []
  (->LocalErrorTracker))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/local  [_ {:keys [config]}]
  (local-error-tracker))

#_(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/local [_]
    empty?)

(defmethod ig/init-key :akvo.lumen.component.error-tracker/prod  [_ {{:keys [dsn opts]} :config}]
  (sentry-error-tracker dsn))


#_(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/prod [_]
    (s/keys :req-un [::dsn ::opts]))

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

(defmethod ig/init-key :akvo.lumen.component.error-tracker/wrap-sentry  [_ {:keys [dsn opts]}]
  #(raven-clj.ring/wrap-sentry % dsn opts))


(s/def ::error-tracker (partial satisfies? p/IErrorTracker))

(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/wrap-sentry [_]
  (s/keys :req-un [::dsn ::opts]))
