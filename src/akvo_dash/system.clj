(ns akvo-dash.system
  (:require [akvo-dash.elastic :as elastic]
            [com.stuartsierra.component :as component]))

(defn new-system [{:keys [elastic-host elastic-port]}]
  (component/system-map
    :elastic (elastic/new-elastic elastic-host elastic-port)))