(ns akvo.lumen.monitoring
  (:require [clojure.spec.alpha :as s]
            [iapetos.collector.jvm :as jvm]
            [iapetos.collector.ring :as ring]
            [akvo.lumen.tenant :as t]
            [akvo.lumen.specs.components :refer [integrant-key]]
            [clojure.tools.logging :as log]
            [iapetos.core :as prometheus]
            [iapetos.registry :as registry]
            [integrant.core :as ig])
  (:import [com.codahale.metrics MetricRegistry]
           [io.prometheus.client.dropwizard DropwizardExports]))

(s/def ::metric-registry (partial instance? MetricRegistry))

(defmethod ig/init-key ::dropwizard-registry [_ _]
  (MetricRegistry.))

(defmethod integrant-key ::dropwizard-registry [_]
  (s/cat :kw keyword?
         :config empty?))

(defmethod ig/init-key ::collector [_ {:keys [dropwizard-registry]}]
  (-> (prometheus/collector-registry)
      (jvm/initialize)
      (prometheus/register (DropwizardExports. dropwizard-registry))
      (ring/initialize {:labels [:tenant]})))

(s/def ::dropwizard-registry ::metric-registry)

(defmethod integrant-key ::collector [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::dropwizard-registry])))

(s/def ::collector (partial satisfies? registry/Registry))
(defmethod ig/init-key ::middleware [_ {:keys [collector]}]
  (fn [handler]
    (ring/wrap-metrics handler collector {:path-fn (constantly "unknown")
                                          :label-fn (fn [request response]
                                                      (let [h (get-in request [:headers "host"])
                                                            tenant (t/tenant-host h)
                                                            path (:template (:reitit.core/match request))]
                                                        (log/debug :tenant tenant :path path)
                                                        {:path path
                                                         :tenant tenant}))})))

(defmethod integrant-key ::middleware [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::collector])))


(defn routes [{:keys [registry] :as opts}]
  ["/metrics" {:get {:handler (fn [req] (ring/metrics-response registry))}}])

(defmethod ig/init-key :akvo.lumen.monitoring/endpoint  [_ opts]
  (routes opts))


(comment
  (slurp "http://localhost:3000/metrics")
  )
