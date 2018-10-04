(ns akvo.lumen.component.hikaricp
  (:require [integrant.core :as ig]
            [duct.database.sql.hikaricp]))

(defmethod ig/init-key :akvo.lumen.component.hikaricp/hikaricp  [_ {:keys [ config] :as opts}]
  (ig/init-key :duct.database.sql/hikaricp {:jdbc-url (-> config :db :uri)}))

(defmethod ig/halt-key! :akvo.lumen.component.hikaricp/hikaricp  [_ opts]
  (ig/halt-key! :duct.database.sql/hikaricp opts))
