(ns user
  (:require [clojure.repl :refer :all]
            [clojure.pprint :refer [pprint]]
            [clojure.tools.namespace.repl :refer [refresh]]
            [clojure.java.io :as io]
            [com.stuartsierra.component :as component]
            [eftest.runner :as eftest]
            [meta-merge.core :refer [meta-merge]]
            [reloaded.repl :refer [system init start stop go reset]]
            [ring.middleware.stacktrace :refer [wrap-stacktrace]]
            ;; [duct.component.ragtime :as ragtime]
            ;; [org.akvo.dash.component.migra :as migrathor]
            [org.akvo.dash.config :as config]
            [org.akvo.dash.system :as system]
            [org.akvo.dash.migrate :as mig]))

(def dev-config
  {:app {:middleware [wrap-stacktrace]}})

(def config
  (meta-merge config/defaults
              config/environ
              dev-config))

(defn new-system []
  (into (system/new-system config)
        {}))

(ns-unmap *ns* 'test)

(defn test []
  (eftest/run-tests (eftest/find-tests "test") {:multithread? false}))

;; (defn migrate []
;;   (-> system :ragtime ragtime/reload ragtime/migrate))

;; (defn migrathor []
;;   (-> system :migrathor migrathor/migrate))

(defn migrate []
  (mig/migrate {:connection-uri (-> config :db :uri)}))

;; (defn rollback
;;   ([]  (rollback 1))
;;   ([x] (-> system :ragtime ragtime/reload (ragtime/rollback x))))

(when (io/resource "local.clj")
  (load "local"))

(reloaded.repl/set-init! new-system)
