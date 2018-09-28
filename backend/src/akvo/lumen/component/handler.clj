(ns akvo.lumen.component.handler
  (:require [com.stuartsierra.component :as component]
            [integrant.core :as ig]
            [duct.component.handler :as h]
            [clojure.tools.logging :as log]))


(defmethod ig/init-key :akvo.lumen.component.handler/handler  [_ {:keys [endpoints config] :as opts}]
  (log/debug "init-key" :akvo.lumen.component.handler :opts opts)
  (component/start (h/handler-component {:endpoints endpoints :middleware (-> config :app :middleware)})))

(defmethod ig/halt-key! :akvo.lumen.component.handler/handler  [_ opts]
  (log/debug "halt-key" :akvo.lumen.component.handler opts)
  (component/stop opts))
