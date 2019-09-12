(ns dev
  (:refer-clojure :exclude [test])
  (:require [akvo.lumen.config :as config]
            [akvo.lumen.endpoint.commons]
            [akvo.lumen.component.keycloak :as keycloak]
            [akvo.lumen.lib.aes :as aes]
            [akvo.lumen.migrate :as lumen-migrate]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.specs]
            [akvo.lumen.test-utils :as tu]
            [cheshire.core :as json]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.java.jdbc :as jdbc]
            [clojure.pprint :refer [pprint]]
            [clojure.repl :refer :all]
            [akvo.lumen.component.tenant-manager]
            [clojure.spec.alpha :as s]
            [clojure.spec.test.alpha :as stest]
            [clojure.tools.logging :as log]
            [clojure.tools.namespace.repl :as repl]
            [dev.commons :as commons]
            [duct.core :as duct]
            [duct.generate :as gen]
            [integrant.core :as ig]
            [integrant.repl :as ir]
            [akvo.lumen.admin.add-tenant :as add-tenant]
            [akvo.lumen.admin.db :as admin.db]
            [akvo.lumen.admin.remove-tenant :as remove-tenant]
            [integrant.repl.state :as state :refer (system)])
  (:import [org.postgresql.util PSQLException PGobject]))

(defn check-specs! []
  (log/warn "instrumenting specs!")
  (stest/instrument))

(defn uncheck-specs! []
  (log/warn "unstrumenting specs!")
  (stest/unstrument))

(defn refresh []
  (uncheck-specs!)
  (repl/refresh)
  (check-specs!))

(defn go []
  (commons/config)
  (ir/go))

(defn halt! []
  (ir/halt))

(def stop halt!)

(def reset go)

(when (io/resource "local.clj")
  (load "local"))

(gen/set-ns-prefix 'akvo.lumen)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Seed
;;;


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Migrate
;;;

(defn migrate []
  (lumen-migrate/migrate (commons/config)))

(defn migrate-and-seed []
  (migrate)
  (tu/seed (commons/config))
  (migrate))

(defn rollback
  ([] (lumen-migrate/rollback (commons/config) {}))
  ([args] (lumen-migrate/rollback (commons/config) args)))

(defn reset-db []
  (rollback)
  (migrate))

(defn db-conn
  ([label] (p/connection (:akvo.lumen.component.tenant-manager/tenant-manager system) label))
  ([] (db-conn "t1")))

(defn dev-ig-derives []
  (derive :akvo.lumen.component.emailer/dev-emailer :akvo.lumen.component.emailer/emailer))

(comment
  (do
    (def s (let [prod? false
                 [ks edn-file] (if prod?
                                 [(do (add-tenant/ig-derives)
                                      (add-tenant/ig-select-keys)) "prod.edn"]
                                 [(do (dev-ig-derives)
                                      [:akvo.lumen.component.emailer/dev-emailer]) "local.edn"])]
             (add-tenant/admin-system
              (commons/config ["akvo/lumen/config.edn" "test.edn" edn-file] prod?)
              ks)))
    (let [o (:akvo.lumen.admin/add-tenant s)]
      (binding [admin.db/env-vars (:root (:db o))]
        (let [encryption-key (-> o :db-settings :encryption-key)
              drop-if-exists? (-> o :drop-if-exists?)
              label "milo4"
              email "juan@akvo.org"
              url (format "https://%s.akvolumen.org" label)
              title "milo4"
              dbs (add-tenant/db-uris label (add-tenant/new-tenant-db-pass) (-> o :db :lumen :password))]
          (add-tenant/exec o {:url url :title title :email email :auth-type "keycloak" :dbs dbs})
          #_(remove-tenant/cleanup-keycloak (:authorizer o) label)
          #_(add-tenant/drop-tenant-database encryption-key label dbs)
          #_(add-tenant/setup-tenant-database label title encryption-key dbs drop-if-exists?)
          #_(add-tenant/setup-tenant-in-keycloak (:authorizer o) label email url))))

    )
)



