(ns org.akvo.dash.fixtures
  (:require
   ;; [duct.component.ragtime :as ragtime]
   [reloaded.repl :refer [system stop go]]))


(defn system-fixture
  "Just a dummy fixture while we rework stuff"
  [f]
  (f))


;; (defn system-fixture
;;   "Starts the system and migrates, no setup or tear down."
;;   [f]
;;   (try
;;     (go)
;;     (-> system :ragtime ragtime/reload ragtime/migrate)
;;     (f)
;;     (-> system :ragtime ragtime/reload (ragtime/rollback "001-activity"))
;;     (finally (stop))))
