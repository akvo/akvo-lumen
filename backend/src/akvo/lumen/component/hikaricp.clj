(ns akvo.lumen.component.hikaricp
  (:require [clojure.set]
            [integrant.core :as ig]
            [duct.database.sql.hikaricp]))

(defmethod ig/init-key :akvo.lumen.component.hikaricp/hikaricp  [_ opts]
  (println opts)
  (ig/init-key :duct.database.sql/hikaricp (clojure.set/rename-keys opts {:uri :jdbc-url})))

(defmethod ig/halt-key! :akvo.lumen.component.hikaricp/hikaricp  [_ opts]
  (ig/halt-key! :duct.database.sql/hikaricp opts))
