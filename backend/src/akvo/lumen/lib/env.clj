(ns akvo.lumen.lib.env
  (:require [akvo.lumen.db.env :as db.env]))

(defn all
  [tenant-conn]
  (let [config (db.env/all-values tenant-conn)]
    (reduce (fn [acc {:keys [id value]}]
              (assoc acc id value))
            {} config)))

(defn upsert
  "use example (db.env/upsert-env conn {:id 'hola' :value [true]})
  pay attention, value is represented in env table as jsonb
  "
  [tenant-conn id value]
  (db.env/upsert-env tenant-conn {:id id :value value}))
