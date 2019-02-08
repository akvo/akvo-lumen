(ns akvo.lumen.monitoring
  (:require [clojure.spec.alpha :as s]
            [iapetos.collector.jvm :as jvm]
            [iapetos.collector.ring :as ring]
            [iapetos.core :as prometheus]
            [integrant.core :as ig])
  (:import [com.codahale.metrics MetricRegistry]
           [io.prometheus.client.dropwizard DropwizardExports]))

(s/def ::metric-registry (partial instance? MetricRegistry))

(defmethod ig/init-key ::dropwizard-registry [_ _]
  (MetricRegistry.))

(defmethod ig/init-key ::collector [_ {:keys [dropwizard-registry]}]
  (-> (prometheus/collector-registry)
      (jvm/initialize)
      (prometheus/register (DropwizardExports. dropwizard-registry))
      (ring/initialize {:labels [:tenant]})))

(defmethod ig/init-key ::middleware [_ {:keys [collector]}]
  #(-> %
       (ring/wrap-metrics collector {:path-fn (constantly "unknown")
                                     :label-fn (fn [request _]
                                                 {:tenant (:tenant request)})})))

(comment
  (slurp "http://localhost:3000/metrics")
  )
