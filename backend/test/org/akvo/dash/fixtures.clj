(ns org.akvo.dash.fixtures
  (:require
   [duct.component.ragtime :as ragtime]
   [reloaded.repl :refer [system stop go]]))


(defn system-fixture
  "Starts the system and migrates, no setup or tear down."
  [f]
  (try
    (go)
    (-> system :ragtime ragtime/reload ragtime/migrate)
    (f)
    (finally (stop))))
