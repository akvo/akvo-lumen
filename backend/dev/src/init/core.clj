(ns init.core
  (:require [dev :refer [check-specs! go migrate]]))


(defn start []
  (println "Starting Backend...")
  (dev/check-specs!)
  (dev/go)
  (dev/migrate-and-seed)
  (println "Brave developer, REPL at will!"))
