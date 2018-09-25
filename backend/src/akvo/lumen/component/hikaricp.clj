(ns akvo.lumen.component.hikaricp
  "add integrant support"
  (:require [integrant.core :as ig]
            [com.stuartsierra.component :as component]
            [clojure.tools.logging :as log]))


(defmethod ig/init-key :akvo.lumen.component.hikaricp  [_ opts]
  (println "init-key"  :opts opts)
  (ig/init-key :duct.database.sql/hikaricp {:jdbc-url (-> opts :db :uri)}))


(defmethod ig/halt-key! :akvo.lumen.component.hikaricp  [_ opts]
  (println "halt-key"  opts)
  (ig/halt-key! :duct.database.sql/hikaricp opts))

