(ns akvo.lumen.monitoring
  (:require [clojure.spec.alpha :as s]
            [iapetos.collector.jvm :as jvm]
            [iapetos.collector.ring :as ring]
            [akvo.lumen.specs.components :refer [integrant-key]]
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
  #(-> %
       (ring/wrap-metrics collector {:path-fn (constantly "unknown")
                                     :label-fn (fn [request _]
                                                 {:tenant (:tenant request)})})))

(defmethod integrant-key ::middleware [_]
  (s/cat :kw keyword?
         :config (s/keys :req-un [::collector])))



(comment
  (slurp "http://localhost:3000/metrics")
  )
