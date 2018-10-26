(ns akvo.lumen.lumen-monitoring
  (:require [iapetos.core :as prometheus]
            [iapetos.collector.jvm :as jvm]
            [iapetos.collector.ring :as ring]
            [integrant.core :as ig]
            [iapetos.collector.exceptions :as ex])
  (:import (io.prometheus.client.dropwizard DropwizardExports)
           (com.codahale.metrics MetricRegistry)))


(defmethod ig/init-key ::collector [_ config]
  (-> (prometheus/collector-registry)
      (jvm/initialize)
      (prometheus/register (DropwizardExports. (MetricRegistry.)))
      (ring/initialize)))

(defmethod ig/init-key ::middleware [_ {:keys [collector]}]
  #(-> %
       (ring/wrap-metrics collector {:path-fn (constantly "unknown")})))

(comment
  (slurp "http://localhost:3000/metrics")
  )