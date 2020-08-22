(ns user
  (:require [dev :as dev]))


(defn dev
  "Load and switch to the 'dev' namespace."
  []
  (require 'dev)
  (in-ns 'dev)
  :loaded)

(defn kick-start []
  (println "Starting Backend...")
  (dev/check-specs!)
  (dev/go)
  (dev/migrate-and-seed)
  (println "Brave developer, REPL at will!"))

#_(kick-start)
