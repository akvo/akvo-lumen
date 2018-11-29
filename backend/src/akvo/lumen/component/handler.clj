(ns akvo.lumen.component.handler
  (:require [compojure.core :as compojure.core]
            [compojure.response :as compojure.res]
            [integrant.core :as ig]
            [ring.middleware.defaults]
            [ring.middleware.json]
            [ring.middleware.stacktrace]
            [ring.util.response :as ring.response]))

;; code from older versions of duct.component.handler
(defn- find-endpoint-keys [component]
  (sort (map key (filter (comp :routes val) component))))

(defn- find-routes [component]
  (:endpoints component (find-endpoint-keys component)))

(defn- middleware-fn [f args]
  (let [args (if (or (nil? args) (sequential? args)) args (list args))]
    #(apply f % args)))

(defn- middleware-map [{:keys [functions arguments]}]
  (reduce-kv (fn [m k v] (assoc m k (middleware-fn v (arguments k)))) {} functions))

(defn- compose-middleware [{:keys [applied] :as middleware}]
  (->> (reverse applied)
       (map (middleware-map middleware))
       (apply comp identity)))

(defmethod ig/init-key :akvo.lumen.component.handler/handler  [_ {:keys [endpoints config handler] :as opts}]
  (if-not handler
    (let [component {:endpoints endpoints :middleware (-> config :app :middleware)}
          routes  (find-routes component)
          wrap-mw (compose-middleware (:middleware component))
          handler (wrap-mw (apply compojure.core/routes routes))]
      (assoc component :handler handler))
    opts))

(defmethod ig/halt-key! :akvo.lumen.component.handler/handler  [_ opts]
  (dissoc opts :handler))

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-stacktrace  [_ opts]
  ring.middleware.stacktrace/wrap-stacktrace)

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-json-body  [_ opts]
  ring.middleware.json/wrap-json-body)

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-json-response  [_ opts]
  ring.middleware.json/wrap-json-response)

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-defaults  [_ opts]
  ring.middleware.defaults/wrap-defaults)

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-hide-errors  [_ opts]
  (fn [handler error-response]
    (fn [request]
      (try
        (handler request)
        (catch Throwable _
          (-> (compojure.res/render error-response request)
              (ring.response/content-type "text/html")
              (ring.response/status 500)))))))

(defmethod ig/init-key :akvo.lumen.component.handler/wrap-not-found  [_ opts]
  (fn [handler error-response]
    (fn [request]
      (or (handler request)
          (-> (compojure.res/render error-response request)
              (ring.response/content-type "text/html")
              (ring.response/status 404))))))
