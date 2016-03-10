(ns org.akvo.dash.main
  "Akvo Dash starting point."
  (:gen-class)
  (:require [clojure.java.io :as io]
            [com.stuartsierra.component :as component]
            [duct.middleware.errors :refer [wrap-hide-errors]]
            [duct.util.runtime :refer [add-shutdown-hook]]
            [duct.component.ragtime :as ragtime]
            [meta-merge.core :refer [meta-merge]]
            [org.akvo.dash.config :as config]
            [org.akvo.dash.system :refer [new-system]]))

(def prod-config
  {:app {:middleware     [[wrap-hide-errors :internal-error]]
         :internal-error (io/resource "errors/500.html")}})

(def config
  "Merge the default config(file) with provided environment (env vars)."
  (meta-merge config/defaults
              config/environ
              prod-config))

(defn -main [& args]
  (let [system (new-system config)]
    (println "Starting HTTP server on port" (-> system :http :port))
    (add-shutdown-hook ::stop-system #(component/stop system))
    (-> system
        component/start
        :ragtime
        ragtime/reload
        ragtime/migrate)))
