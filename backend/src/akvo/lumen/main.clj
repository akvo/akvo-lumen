(ns org.akvo.lumen.main
  (:gen-class)
  (:require [akvo.commons.psql-util]
            [clojure.java.io :as io]
            [com.stuartsierra.component :as component]
            [duct.util.runtime :refer [add-shutdown-hook]]
            [duct.util.system :refer [load-system]]
            [environ.core :refer [env]]
            [org.akvo.lumen.config :as config]
            [org.akvo.lumen.migrate :as migrate]))


(defn -main [& args]
  (config/assert-bindings)
  (let [system (load-system [(io/resource "org/akvo/lumen/system.edn")]
                            (config/bindings))]
    (println "Starting HTTP server on port" (-> system :http :port))
    (migrate/migrate)
    (add-shutdown-hook ::stop-system #(component/stop system))
    (component/start system)))
