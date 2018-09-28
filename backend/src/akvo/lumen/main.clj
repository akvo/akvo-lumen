(ns akvo.lumen.main
  (:gen-class)
  (:require [akvo.commons.psql-util]
            [akvo.lumen.config :as config]
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
  (def config ((comp duct/prep read-config)))
  #_(derive :akvo.lumen.component.emailer/mailjet-emailer :akvo.lumen.component.emailer/emailer)
  #_(derive :akvo.lumen.component.caddisfly/prod :akvo.lumen.component.caddisfly/caddisfly)
  (underive :akvo.lumen.component.emailer/mailjet-emailer :akvo.lumen.component.emailer/emailer)
  (underive :akvo.lumen.component.caddisfly/prod :akvo.lumen.component.caddisfly/caddisfly)
  (migrate/migrate)
  (let [system (ig/init config)]
    system
    )

  #_(let [system (load-system [(io/resource "akvo/lumen/system.edn")]
                              (config/bindings))]
      (println "Starting HTTP server on port" (-> system :http :port))
      (migrate/migrate)
      (add-shutdown-hook ::stop-system #(component/stop system))
      (component/start system)))
