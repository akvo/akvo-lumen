(ns dev.commons
  (:require [akvo.lumen.test-utils :as tu]
            [integrant.core :as ig]
            [integrant.repl :as ir]))

(def config (let [c (tu/dissoc-prod-components (tu/prep "akvo/lumen/config.edn" "dev.edn"))]
              (ir/set-prep! (fn [] c))
              (ig/load-namespaces c)
              c))

(def tenants (-> config :akvo.lumen.migrate/migrate :seed :tenants))
