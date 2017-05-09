(ns akvo.lumen.admin.add-plan
  "Work in progress. This functionality should probably be added to the
  add tenant script. But we also want to be able to change an existing tenant,
  hence this might survive in some form. But for now this use hard coded local
  tenant 1"
  (:require [akvo.lumen.admin.util :as util]
            [clojure.java.jdbc :as jdbc]))

(defn tier-id [db tier]
  (if-let [id (seq (jdbc/query db ["SELECT id FROM tier WHERE title = ?" tier]))]
    (-> id first :id)
    (throw (ex-info "Tier does not exits" {:tier tier}))))

(defn -main [tier]
  (let [db (util/db-uri {:host "localhost"
                         :database "lumen_tenant_1"
                         :user "lumen"
                         :password "lumen"})
        tier-id (tier-id db tier)
        r (jdbc/insert! db :plan [:tier] [tier-id])]
    (println (format "New %s plan added to %s." tier db))))
