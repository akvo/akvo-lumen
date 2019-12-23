(ns akvo.lumen.db.tenant-manager
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/component/tenant_manager.sql")
