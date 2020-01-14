(ns akvo.lumen.component.hikaricp
  (:require [clojure.set]
            [integrant.core :as ig]
            [clojure.spec.alpha :as s]
            [clojure.string :as str]
            [duct.database.sql.hikaricp]
            [akvo.lumen.monitoring :as monitoring])
  (:import [duct.database.sql Boundary]))

(defn ssl-url [u]
  (let [postgres-arg "sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory"]
    (if (str/includes? u postgres-arg)
      u
      (if (str/includes? u "?")
        (str u "&" postgres-arg)
        (str u "?" postgres-arg)))))

(defmethod ig/init-key :akvo.lumen.component.hikaricp/hikaricp  [_ opts]
  (ig/init-key :duct.database.sql/hikaricp (-> (clojure.set/rename-keys opts {:uri :jdbc-url})
                                               (update :jdbc-url ssl-url))))

(defmethod ig/halt-key! :akvo.lumen.component.hikaricp/hikaricp  [_ opts]
  (ig/halt-key! :duct.database.sql/hikaricp opts))

(s/def ::uri string?)
(s/def ::pool-name string?)
(s/def ::maximum-pool-size pos-int?)
(s/def ::minimum-idle pos-int?)
(s/def ::hikaricp (partial instance? Boundary))
(s/def ::error string?)
(defmethod ig/pre-init-spec :akvo.lumen.component.hikaricp/hikaricp [_]
  (s/keys :req-un [::uri
                   ::pool-name
                   ::maximum-pool-size
                   ::error
                   ::minimum-idle
                   ::monitoring/metric-registry]))
