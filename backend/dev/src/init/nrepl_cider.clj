(ns init.nrepl-cider
  (:require
   [init.core :refer [start]]
   [nrepl.server :refer [start-server]]
   [cider.nrepl :refer [cider-nrepl-handler]]))


(defn -main []
  (start-server
   :bind "0.0.0.0"
   :port 47480
   :handler cider-nrepl-handler)
  (start))
