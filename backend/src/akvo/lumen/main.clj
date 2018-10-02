(ns akvo.lumen.main
  (:gen-class)
  (:require [akvo.commons.psql-util]
            [akvo.lumen.config :as config]
            [akvo.lumen.middleware]
            [akvo.lumen.endpoint]
            [akvo.lumen.migrate :as migrate]
            [clojure.java.io :as io]
            [duct.core :as duct]
            [com.stuartsierra.component :as component]
            [integrant.core :as ig]
            [environ.core :refer [env]]))

(defn read-config []
  (duct/read-config (io/resource "akvo/lumen/config.edn")))

(defn -main [& args]
  (config/assert-bindings)
  (derive :akvo.lumen.component.emailer/mailjet-emailer :akvo.lumen.component.emailer/emailer)
  (derive :akvo.lumen.component.caddisfly/prod :akvo.lumen.component.caddisfly/caddisfly)
  (derive :akvo.lumen.component.error-tracker/prod :akvo.lumen.component.error-tracker/error-tracker)
  #_(underive :akvo.lumen.component.emailer/mailjet-emailer :akvo.lumen.component.emailer/emailer)
  #_(underive :akvo.lumen.component.caddisfly/prod :akvo.lumen.component.caddisfly/caddisfly)
  #_(underive :akvo.lumen.component.error-tracker/prod :akvo.lumen.component.error-tracker/error-tracker)
  (migrate/migrate "akvo/lumen/config.edn")
  (let [config ((comp duct/prep read-config))
        _ (ig/load-namespaces config)
        system (ig/init config)]
    system
    )

  #_(let [system (load-system [(io/resource "akvo/lumen/system.edn")]
                              (config/bindings))]
      (println "Starting HTTP server on port" (-> system :http :port))
      (migrate/migrate)
      (add-shutdown-hook ::stop-system #(component/stop system))
      (component/start system)))
