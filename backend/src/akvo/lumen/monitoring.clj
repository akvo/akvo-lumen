(ns akvo.lumen.monitoring
  (:require [iapetos.core :as prometheus]
            [iapetos.collector.jvm :as jvm]
            [iapetos.collector.ring :as ring]
            [integrant.core :as ig])
  (:import (io.prometheus.client.dropwizard DropwizardExports)
           (com.codahale.metrics MetricRegistry)))

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
