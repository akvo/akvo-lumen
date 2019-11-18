(ns dev.commons
  (:require [akvo.lumen.test-utils :as tu]
            [akvo.lumen.config :as config]
            [clojure.java.io :as io]
            [integrant.core :as ig]
            [integrant.repl :as ir]))

(derive :akvo.lumen.utils.dev-emailer/emailer :akvo.lumen.component.emailer/emailer)
(derive :akvo.lumen.component.caddisfly/local :akvo.lumen.component.caddisfly/caddisfly)
(derive :akvo.lumen.component.error-tracker/local :akvo.lumen.component.error-tracker/error-tracker)

(defn dissoc-prod-components [c]
  (dissoc c
          :akvo.lumen.component.emailer/mailjet-v3-emailer
          :akvo.lumen.component.caddisfly/prod
          :akvo.lumen.component.error-tracker/prod))

(defn config
  ([]
   (config false))
  ([prod?]
   (config ["akvo/lumen/config.edn" "test.edn" "dev.edn"
            (when (io/resource "local.edn") "local.edn")] prod?))
  ([config-files prod?]
   (let [config-files* (config/prep config-files)
         config-files* (if-not prod? (dissoc-prod-components config-files*) config-files*)]
     (ir/set-prep! (fn [] config-files*))
     (ig/load-namespaces config-files*)
     config-files*)))


(def tenants (-> (config) :akvo.lumen.migrate/migrate :seed :tenants))
