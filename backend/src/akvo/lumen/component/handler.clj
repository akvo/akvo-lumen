(ns akvo.lumen.component.handler
  (:require [compojure.response :as compojure.res]
            [integrant.core :as ig]
            [clojure.tools.logging :as log]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [akvo.lumen.endpoint.commons :as commons]
            [reitit.ring :as ring]
            [reitit.coercion.spec]
            [clojure.tools.logging :as log]
            [muuntaja.core :as m]
            [reitit.ring.coercion :as rrc]
            [clojure.spec.alpha :as s]
            [ring.middleware.defaults]
            [ring.middleware.json]
            [ring.middleware.stacktrace]
            [ring.util.response :as ring.response]))

(defmethod ig/init-key :akvo.lumen.component.handler/handler  [_ {:keys [endpoints middleware handler] :as opts}]
  (if-not handler
    (let [
          routes  (->> endpoints
                       (reduce-kv (fn [c k v]
                                    (conj c [k v])) [] ))
          handler (ring/ring-handler
                   (ring/router routes
                                {:data {:middleware middleware}
                                 :conflicts (constantly nil)}))]
      (assoc opts :handler handler))
    opts))

(s/def ::endpoints (s/coll-of fn?
                              ;;:count 24
                              :distinct true))

(s/def ::functions (s/map-of keyword? fn?))
(s/def ::applied (s/coll-of keyword?  :distinct true))
(s/def ::middleware (s/keys :req-un [::functions ::applied]))

(s/def ::config (s/keys :req-un [::endpoints ::middleware]))
(s/def ::handler fn?)

;; (defmethod integrant-key :akvo.lumen.component.handler/handler [_]
;;   (s/cat :kw keyword?
;;          :config ::config))

(defmethod ig/halt-key! :akvo.lumen.component.handler/handler  [_ opts]
  (dissoc opts :handler))

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-stacktrace  [_ opts]
  ring.middleware.stacktrace/wrap-stacktrace)

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-json-body  [_ opts]
  ring.middleware.json/wrap-json-body)

(defmethod integrant-key :akvo.lumen.component.handler/wrap-json-body [_]
  (s/cat :kw keyword?
         :config empty?))

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

(defmethod integrant-key :akvo.lumen.component.handler/wrap-defaults [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::params ::responses])))


(defmethod ig/init-key :akvo.lumen.component.handler/wrap-hide-errors  [_ {:keys [error-response]}]
  (fn [handler]
    (fn [request]
      (try
        (handler request)
        (catch Throwable t
          (log/error t "500 App Error")
          (log/info :request-on-500 request)
          (-> (compojure.res/render error-response request)
              (ring.response/content-type "text/html")
              (ring.response/status 500)))))))

(s/def ::error-response string?)

(defmethod integrant-key :akvo.lumen.component.handler/wrap-hide-errors [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::error-response])))

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-not-found  [_ {:keys [error-response]}]
  (fn [handler]
    (fn [request]
      (or (handler request)
          (-> (compojure.res/render error-response request)
              (ring.response/content-type "text/html")
              (ring.response/status 404))))))

(defmethod integrant-key :akvo.lumen.component.handler/wrap-not-found [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::error-response])))

(defmethod ig/init-key :akvo.lumen.component.handler/variant  [_ _]
  (fn [handler]
    (fn [request]
      (let [res (handler request)]
        (if (vector? res)
          (commons/variant->response res request)
          res)))))
