(ns akvo.lumen.component.handler
  (:require [akvo.lumen.endpoint.commons :as commons]
            [clojure.spec.alpha :as s]
            [clojure.tools.logging :as log]
            [compojure.response :as compojure.res]
            [integrant.core :as ig]
            [muuntaja.core :as m]
            [reitit.coercion.spec]
            [reitit.ring :as ring]
            [reitit.core :as rc]
            [reitit.ring.coercion :as rrc]
            [reitit.spec :as rs]
            [clojure.pprint :refer (pprint)]
            [ring.middleware.defaults]
            [ring.middleware.json]
            [ring.middleware.stacktrace]
            [ring.util.response :as ring.response]))

(defmethod ig/init-key :akvo.lumen.component.handler/handler  [_ {:keys [endpoints middleware handler] :as opts}]
  (if-not handler
    (let [router (ring/router endpoints
                              (merge {:conflicts (constantly nil)}
                                     (when middleware {:data {:middleware (vec (flatten middleware))}})))
          handler (ring/ring-handler router)]
      (assoc opts :handler handler))
    opts))

(defmethod ig/init-key :akvo.lumen.component.handler/handler-api  [_ {:keys [path middleware routes] :as opts}]
  [path {:middleware (vec (flatten middleware))} routes])

(defmethod ig/init-key :akvo.lumen.component.handler/handler-verify  [_ {:keys [path middleware routes] :as opts}]
  [path {:middleware (vec (flatten middleware))} routes])

(defmethod ig/init-key :akvo.lumen.component.handler/handler-share  [_ {:keys [path middleware routes] :as opts}]
  [path {:middleware (vec (flatten middleware))} routes])

(s/def ::endpoints  (s/coll-of ::rs/raw-routes))

(s/def ::middleware (s/coll-of fn? :distinct true))

(s/def ::config (s/keys :req-un [::endpoints]
                        :opt-un [::middleware]))

(s/def ::handler fn?)

(defmethod ig/pre-init-spec :akvo.lumen.component.handler/handler [_]
  ::config)

(defmethod ig/halt-key! :akvo.lumen.component.handler/handler  [_ opts]
  (dissoc opts :handler))

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-stacktrace  [_ opts]
  ring.middleware.stacktrace/wrap-stacktrace)

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-json-body  [_ opts]
  ring.middleware.json/wrap-json-body)

(defmethod ig/pre-init-spec :akvo.lumen.component.handler/wrap-json-body [_]
  empty?)

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-json-response  [_ opts]
  ring.middleware.json/wrap-json-response)

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-defaults  [_ opts]
  #(ring.middleware.defaults/wrap-defaults % opts))

(create-ns  'akvo.lumen.component.handler.wrap-defaults.params)
(alias 'wrap-defaults.params 'akvo.lumen.component.handler.wrap-defaults.params)

(create-ns  'akvo.lumen.component.handler.wrap-defaults.responses)
(alias 'wrap-defaults.responses 'akvo.lumen.component.handler.wrap-defaults.responses)


(s/def ::wrap-defaults.responses/not-modified-responses boolean?)
(s/def ::wrap-defaults.responses/absolute-redirects boolean?)
(s/def ::wrap-defaults.responses/content-types boolean?)
(s/def ::wrap-defaults.responses/default-charset #{"utf-8"})

(s/def ::wrap-defaults.params/urlencoded boolean?)
(s/def ::wrap-defaults.params/keywordize boolean?)

(s/def ::params (s/keys :req-un [::wrap-defaults.params/urlencoded
                                 ::wrap-defaults.params/keywordize]))

(s/def ::responses (s/keys :req-un [::wrap-defaults.responses/not-modified-responses
                                    ::wrap-defaults.responses/absolute-redirects
                                    ::wrap-defaults.responses/content-types
                                    ::wrap-defaults.responses/default-charset]))

(defmethod ig/pre-init-spec :akvo.lumen.component.handler/wrap-defaults [_]
  (s/keys :req-un [::params ::responses]))


(defmethod ig/init-key :akvo.lumen.component.handler/wrap-hide-errors  [_ {:keys [error-response]}]
  (fn [handler]
    (fn [request]
      (try
        (handler request)
        (catch Throwable t
          (log/error t "500 App Error")
          (log/info :request-on-500 (dissoc request :reitit.core/match :data :result :reitit.core/router))
          (-> (compojure.res/render error-response request)
              (ring.response/content-type "text/html")
              (ring.response/status 500)))))))

(s/def ::error-response string?)

(defmethod ig/pre-init-spec :akvo.lumen.component.handler/wrap-hide-errors [_]
  (s/keys :req-un [::error-response]))

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-not-found  [_ {:keys [error-response]}]
  (fn [handler]
    (fn [request]
      (or (handler request)
          (-> (compojure.res/render error-response request)
              (ring.response/content-type "text/html")
              (ring.response/status 404))))))

(defmethod ig/pre-init-spec :akvo.lumen.component.handler/wrap-not-found [_]
  (s/keys :req-un [::error-response]))

(defmethod ig/init-key :akvo.lumen.component.handler/variant  [_ _]
  (fn [handler]
    (fn [request]
      (let [res (handler request)]
        (if (vector? res)
          (commons/variant->response res request)
          res)))))

(defmethod ig/init-key :akvo.lumen.component.handler/common-middleware  [_ opt]
  opt)
