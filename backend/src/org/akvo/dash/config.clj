(ns org.akvo.dash.config
  (:require [environ.core :refer [env]]))

(def defaults
  ^:displace {:http {:port 3000}})

(def environ
  {:http {:port (some-> env :port Integer.)
          :path "api"}
   :db   {:uri  (env :database-url)}})
