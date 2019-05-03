(ns akvo.lumen.component.error-tracker
  (:require [akvo.lumen.protocols :as p]
            [integrant.core :as ig]
            [raven-clj.core :as raven]
            [integrant.core :as ig]
            [raven-clj.ring]
            [clojure.spec.alpha :as s]
            [raven-clj.interfaces :as raven-interface]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Error tracker config
;;;

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


(defmethod ig/init-key :akvo.lumen.component.error-tracker/config-local
  [_ config]
  config)

(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/config-local
  [_]
  (s/keys :req-un [::opts]))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/config-prod
  [_ config]
  config)

(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/config-prod
  [_]
  (s/keys :req-un [::dsn ::opts]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Error tracker component
;;;

;; Local component
(defrecord LocalErrorTracker [])

(defn local-error-tracker []
  (->LocalErrorTracker))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/local
  [_ {:keys [config]}]
  (local-error-tracker))

(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/local
  [_]
  (partial satisfies? p/IErrorTracker))


;; Production component
(defrecord SentryErrorTracker [dsn])

(defn sentry-error-tracker [dsn]
  (SentryErrorTracker. dsn))

(defmethod ig/init-key :akvo.lumen.component.error-tracker/prod
  [_ {{:keys [dsn opts]} :config}]
  (sentry-error-tracker dsn))

(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/prod
  [_]
  (partial satisfies? p/IErrorTracker))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Error tracker protocol implementations
;;;

(defn event-map
  ([error]
   (event-map error {}))
  ([error m]
   (let [text (str (ex-data error))]
     (assoc m
            :extra {:ex-data (subs text 0 (min (count text) 4096))}
            :message (.getMessage error)))))

(comment
  (event-map (Exception. "Dummy error"))
  ;; {:extra {:ex-data ""}, :message "Dummy error"}

  (event-map (ex-info "Dummy error" {:foolish true}))
  ;; {:extra {:ex-data "{:foolish true}"}, :message "Dummy error"}
  )

(extend-protocol p/IErrorTracker

  SentryErrorTracker
  (track [{dsn :dsn
           {:keys [namespaces] :as opts} :opts}
          error]
    (let [event-info (event-map error opts)]
      (->> (raven-interface/stacktrace event-info error namespaces)
           (raven/capture dsn)
           future)))

  LocalErrorTracker
  (track [this error]
    (println "LocalErrorTracker:" (.getMessage error))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Wrap Sentry (Ring error tracker component)
;;;

(defmethod ig/init-key :akvo.lumen.component.error-tracker/wrap-sentry
  [_ {:keys [dsn opts]}]
  #(raven-clj.ring/wrap-sentry % dsn opts))

#_(s/def ::error-tracker (partial satisfies? p/IErrorTracker))

#_(defmethod ig/pre-init-spec :akvo.lumen.component.error-tracker/wrap-sentry [_]
    (s/keys :req-un [::dsn ::opts]))
