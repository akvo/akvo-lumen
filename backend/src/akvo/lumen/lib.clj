(ns akvo.lumen.lib)

(defn- variant [variant-key]
  {:pre [(keyword? variant-key)]}
  (fn [value]
    [variant-key value]))

(def ok (variant ::ok))
(def created (variant ::created))
(def bad-request (variant ::bad-request))
(def not-authenticated (variant ::not-authenticated))
(def not-authorized (variant ::not-authorized))
(def not-found (variant ::not-found))
(def conflict (variant ::conflict))
(def gone (variant ::gone))
(def internal-server-error (variant ::internal-server-error))
(def not-implemented (variant ::not-implemented))
(def unprocessable-entity (variant ::unprocessable-entity))
(def redirect (variant ::redirect))
(defn no-content [] [::no-content nil])
