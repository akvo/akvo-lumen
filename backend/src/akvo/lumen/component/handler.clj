(ns akvo.lumen.component.handler
  (:require [compojure.core :as compojure]
            [integrant.core :as ig]))
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
          handler (wrap-mw (apply compojure/routes routes))]
      (assoc component :handler handler))
    opts))

(defmethod ig/halt-key! :akvo.lumen.component.handler/handler  [_ opts]
  (dissoc opts :handler))
