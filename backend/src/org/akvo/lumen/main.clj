(ns org.akvo.lumen.main
    (:gen-class)
    (:require [akvo.commons.psql-util]
              [com.stuartsierra.component :as component]
              [duct.util.runtime :refer [add-shutdown-hook]]
              [duct.util.system :refer [load-system]]
              [environ.core :refer [env]]
              [clojure.java.io :as io]))


(defn -main [& args]
  (let [bindings {'db-uri (:lumen-db-url env "jdbc:postgresql://localhost/lumen?user=lumen&password=password")
                  'http-port (Integer/parseInt (:port env "3000"))
                  'keycloak-realm "akvo"
                  'keycloak-url (:lumen-keycloak-url env "http://localhost:8080/auth")
                  'flow-report-database-url (env :flow-report-database-url)
                  'file-upload-path (env :file-upload-path)}
        system   (load-system [(io/resource "org/akvo/lumen/system.edn")]
                              bindings)]
    (println "Starting HTTP server on port" (-> system :http :port))
    (add-shutdown-hook ::stop-system #(component/stop system))
    (component/start system)))
