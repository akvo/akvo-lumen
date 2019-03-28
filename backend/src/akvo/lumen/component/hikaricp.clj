(ns akvo.lumen.component.hikaricp
  (:require [clojure.set]
            [integrant.core :as ig]
            [clojure.spec.alpha :as s]
            [duct.database.sql.hikaricp]
            [akvo.lumen.monitoring :as monitoring])
  (:import [duct.database.sql Boundary]))

(defmethod ig/init-key :akvo.lumen.component.hikaricp/hikaricp  [_ opts]
  (ig/init-key :duct.database.sql/hikaricp (clojure.set/rename-keys opts {:uri :jdbc-url})))

(defmethod ig/halt-key! :akvo.lumen.component.hikaricp/hikaricp  [_ opts]
  (ig/halt-key! :duct.database.sql/hikaricp opts))

(s/def ::uri string?)
(s/def ::pool-name string?)
(s/def ::maximum-pool-size pos-int?)
(s/def ::minimum-idle pos-int?)
(s/def ::hikaricp (partial instance? Boundary))

(defmethod ig/pre-init-spec :akvo.lumen.component.hikaricp/hikaricp [_]
  (s/keys :req-un [::uri
                   ::pool-name
                   ::maximum-pool-size
                   ::minimum-idle
                   ::monitoring/metric-registry]))
