(ns akvo.lumen.db.env
  (:require [hugsql.core :as hugsql]))

(hugsql/def-db-fns "akvo/lumen/lib/env.sql")

(defn activate-flag [conn flag-id]
  (or (= 1 (db-update-boolean-flag conn {:id flag-id :value "true"}))
      (db-insert-boolean-flag conn {:id flag-id})))

(defn deactivate-flag [conn flag-id]
 (db-update-boolean-flag conn {:id flag-id :value "false"}))
