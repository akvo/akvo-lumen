(ns akvo.lumen.main
  (:gen-class)
  (:require [akvo.lumen.config :as config]
            [akvo.lumen.endpoint.commons]
            [akvo.lumen.migrate :as migrate]
            [clojure.java.io :as io]
            [clojure.spec.test.alpha :as stest]
            [duct.core :as duct]
            [integrant.core :as ig]))

(def config-file "akvo/lumen/config.edn")

(defn -main [& args]
  (config/assert-bindings)
  (derive :akvo.lumen.component.emailer/mailjet-v3-emailer :akvo.lumen.component.emailer/emailer)
  (derive :akvo.lumen.component.caddisfly/prod :akvo.lumen.component.caddisfly/caddisfly)
  (derive :akvo.lumen.component.error-tracker/prod :akvo.lumen.component.error-tracker/error-tracker)
  (derive :akvo.lumen.auth/wrap-auth-prod :akvo.lumen.auth/wrap-auth)
  (let [config (config/construct config-file)
        _   (migrate/migrate config)
        _ (ig/load-namespaces config)
        system (ig/init config)]
    (when (:conform-specs (:akvo.lumen.specs/specs system))
      (stest/instrument))
    system))
