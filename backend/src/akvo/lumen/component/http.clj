(ns org.akvo.lumen.component.http
  "Immutant web Duct component."
  (:require [com.stuartsierra.component :as component]
            [immutant.web :as web]))

(defrecord Http [app]
  component/Lifecycle

  (start [this]
    (if (:server this)
      this
      (assoc this :server (web/run
                            (-> this :app :handler)
                            (assoc {:host "0.0.0.0"}
                                   :port (:port this))))))

  (stop [this]
    (when-some [server (:server this)]
      (web/stop server))
    (dissoc this :server)))

(defn http [options]
  (map->Http options))
