(ns akvo.lumen.component.handler
  (:require [compojure.core :as compojure.core]
            [compojure.response :as compojure.res]
            [integrant.core :as ig]
            [akvo.lumen.specs.components :refer (integrant-key)]
            [clojure.spec.alpha :as s]
            [ring.middleware.defaults]
            [ring.middleware.json]
            [ring.middleware.stacktrace]
            [ring.util.response :as ring.response]))

;; code from older versions of duct.component.handler
(defn- find-endpoint-keys [component]
  (sort (map key (filter (comp :routes val) component))))

(defn- find-routes [component]
  (:endpoints component (find-endpoint-keys component)))

(defn- middleware-map [{:keys [functions]}]
  (reduce-kv (fn [m k v] (assoc m k v)) {} functions))

(defn- compose-middleware [{:keys [applied] :as middleware}]
  (->> (reverse applied)
       (map (middleware-map middleware))
       (apply comp identity)))

(defmethod ig/init-key :akvo.lumen.component.handler/handler  [_ {:keys [endpoints middleware handler] :as opts}]
  (if-not handler
    (let [component {:endpoints endpoints :middleware middleware}
          routes  (find-routes component)
          wrap-mw (compose-middleware (:middleware component))
          handler (wrap-mw (apply compojure.core/routes routes))]
      (assoc component :handler handler))
    opts))

(s/def ::endpoints (s/coll-of fn? :count 24 :distinct true))

(s/def ::functions (s/map-of keyword? fn?))
(s/def ::applied (s/coll-of keyword?  :distinct true))
(s/def ::middleware (s/keys :req-un [::functions ::applied]))

(s/def ::config (s/keys :req-un [::endpoints ::middleware]))
(s/def ::handler fn?)
(defmethod integrant-key :akvo.lumen.component.handler/handler [_]
  (s/cat :kw keyword?
         :config ::config))

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
        (catch Throwable _
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
