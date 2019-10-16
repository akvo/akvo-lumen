(ns akvo.lumen.monitoring
  (:require [clojure.spec.alpha :as s]
            [iapetos.collector.jvm :as jvm]
            [iapetos.collector.ring :as ring]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [iapetos.core :as prometheus]
            [iapetos.registry :as registry]
            [integrant.core :as ig])
  (:import [com.codahale.metrics MetricRegistry]
           [io.prometheus.client.dropwizard DropwizardExports]))

(s/def ::metric-registry (partial instance? MetricRegistry))

(defmethod ig/init-key ::dropwizard-registry [_ _]
  (MetricRegistry.))

(defmethod ig/pre-init-spec ::dropwizard-registry [_]
  empty?)

(defmethod ig/init-key ::collector [_ {:keys [dropwizard-registry]}]
  (-> (prometheus/collector-registry)
      (jvm/initialize)
      (prometheus/register (DropwizardExports. dropwizard-registry)
                           (prometheus/histogram :app/flow-check-permissions {:labels [:tenant]})
                           (prometheus/histogram :app/auth-allowed-paths)
                           (prometheus/histogram :app/load-auth-data {:labels [:tenant]})
                           (prometheus/histogram :app/auth-datasets {:labels [:tenant]})
                           (prometheus/histogram :app/auth-visualisations {:labels [:tenant]})
                           (prometheus/histogram :app/auth-dashboards {:labels [:tenant]})
                           (prometheus/histogram :app/auth-collections {:labels [:tenant]}))
      (ring/initialize {:labels [:tenant]})))

(s/def ::dropwizard-registry ::metric-registry)

(defmethod ig/pre-init-spec ::collector [_]
  (s/keys :req-un [::dropwizard-registry]))

(s/def ::collector (partial satisfies? registry/Registry))
(defmethod ig/init-key ::middleware [_ {:keys [collector]}]
  (fn [handler]
    (ring/wrap-metrics handler collector {:path-fn (constantly "unknown")
                                          :label-fn (fn [request response]
                                                      (let [tenant (:tenant request)
                                                            path (if-let [unwrap-params (get-in request [:reitit.core/match :data :monitoring :unwrap?])]
                                                                   (reduce (fn [c [k v]] (string/replace c (re-pattern (str k)) v))
                                                                           (:template (:reitit.core/match request))
                                                                           (select-keys (:path-params request) unwrap-params))
                                                                   (:template (:reitit.core/match request)))]
                                                        (log/debug :tenant tenant :path path)
                                                        {:path path
                                                         :tenant tenant}))})))

(defmethod ig/pre-init-spec ::middleware [_]
  (s/keys :req-un [::collector]))


(defn routes [{:keys [registry] :as opts}]
  ["/metrics" {:get {:handler (fn [req] (ring/metrics-response registry))}}])

(defmethod ig/init-key :akvo.lumen.monitoring/endpoint  [_ opts]
  (routes opts))


(comment
  (slurp "http://localhost:3000/metrics")
  )
