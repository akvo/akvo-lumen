(ns akvo-dash.elastic
  (:require [clojurewerkz.elastisch.rest :as esr]
            [com.stuartsierra.component :as component]))

(defrecord Elastic [host port]

  component/Lifecycle

  (start [component]
    (prn "Connecting to Elastic cluster")
    (assoc component :conn (esr/connect (str "http://" host ":" port))))

  (stop [component]
    (prn "Resetting connection to Elastic cluster")
    (assoc component :conn nil)))

(defn new-elastic [host port]
  (map->Elastic {:host host :port port}))


