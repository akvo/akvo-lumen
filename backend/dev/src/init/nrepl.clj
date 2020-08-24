(ns init.nrepl
  (:require
   [init.core :refer [start]]
   [nrepl.server :refer [start-server]]))


(defn -main []
  (start-server
   :bind "0.0.0.0"
   :port 47480)
  (start))
