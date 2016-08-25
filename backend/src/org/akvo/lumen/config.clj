(ns org.akvo.lumen.config
  (:require [environ.core :refer [env]]))

(def bindings
  {'db-uri (:lumen-db-url env "jdbc:postgresql://localhost/lumen?user=lumen&password=password")
   'http-port (Integer/parseInt (:port env "3000"))
   'keycloak-realm "akvo"
   'keycloak-url (:lumen-keycloak-url env "http://localhost:8080/auth")
   'flow-report-database-url (env :lumen-flow-report-database-url)
   'file-upload-path (env :lumen-file-upload-path)})
