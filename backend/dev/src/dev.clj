(ns dev
  (:refer-clojure :exclude [test])
  (:require [akvo.lumen.endpoint.commons]
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
            [akvo.lumen.admin.system :as admin.system]
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
    (let [prod? false
          [ks edn-file] (if prod?
                          [(do (admin.system/ig-derives)
                               (admin.system/ig-select-keys
                                [:akvo.lumen.admin/remove-tenant
                                 :akvo.lumen.admin/add-tenant])) "prod.edn"]
                          [(do (dev-ig-derives)
                               [:akvo.lumen.component.emailer/dev-emailer
                                :akvo.lumen.admin.db/config
                                :akvo.lumen.admin/remove-tenant
                                :akvo.lumen.admin/add-tenant
                                ]) "local-admin.edn"])
          c* (commons/config ["akvo/lumen/config.edn" "akvo/lumen/admin.edn" "test.edn" edn-file] prod?)
          s (admin.system/new-system c* ks)
          admin-add-tenant (:akvo.lumen.admin/add-tenant s)
          admin-remove-tenant (:akvo.lumen.admin/remove-tenant s)]
      (binding [admin.db/env-vars (:root (:dbs admin-add-tenant))]
        (let [encryption-key (-> admin-add-tenant :db-settings :encryption-key)
              drop-if-exists? (-> admin-add-tenant :drop-if-exists?)
              label "milo4"
              email "juan@akvo.org"
              url (format "https://%s.akvolumen.org" label)
              title "milo4"]
          (add-tenant/exec admin-add-tenant {:url url :title title :email email :auth-type "keycloak"})
          #_(remove-tenant/exec admin-remove-tenant label)))
      
      )
    

    )


)



