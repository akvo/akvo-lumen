(ns akvo.lumen.component.hikaricp
  "add integrant support"
  (:require [integrant.core :as ig]
            [com.stuartsierra.component :as component]
            [duct.database.sql.hikaricp]
            [clojure.tools.logging :as log]))


(defmethod ig/init-key :akvo.lumen.component.hikaricp/hikaricp  [_ {:keys [ config] :as opts}]
  (println "init-key"  :opts opts)
  (ig/init-key :duct.database.sql/hikaricp {:jdbc-url (-> config :db :uri)}))


(defmethod ig/halt-key! :akvo.lumen.component.hikaricp/hikaricp  [_ opts]
  (println "halt-key"  opts)
  (ig/halt-key! :duct.database.sql/hikaricp opts))


(defmethod ig/init-key :akvo.lumen.component.other  [_ opts]
  (println "init-key other"  :opts opts)
  {:me opts})


(defmethod ig/halt-key! :akvo.lumen.component.other  [_ opts]
  (println "halt-key other"  :opts opts)
  {})
