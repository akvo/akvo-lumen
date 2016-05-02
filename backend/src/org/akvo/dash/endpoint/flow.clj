(ns org.akvo.dash.endpoint.flow
  (:require [clojure.string :as str]
            [clojure.set :as set]
            [compojure.core :refer :all]
            [ring.util.response :refer (response)]
            [hugsql.core :as hugsql]))


(hugsql/def-db-fns "org/akvo/dash/import/flow.sql")

(defn endpoint [{{:keys [flow-report-database-url]} :config}]
  (context "/flow" _
    (GET "/folders-and-surveys/:org-id" request
      (let [org-id (-> request :params :org-id)
            root-ids (let [roles (get-in request [:jwt-claims "realm_access" "roles"])
                           pattern (re-pattern (format "akvo:flow:%s:(\\d+?)" org-id))]
                       (->> roles
                            (map (fn [role]
                                   (when-let [id (second (re-find pattern role))]
                                     (Long/parseLong id))))
                            (remove nil?)))]
        (if-not (empty? root-ids)
          (response (descendant-folders-and-surveys-by-folder-id
                     (format flow-report-database-url org-id)
                     {:folder-ids root-ids}
                     {}
                     :identifiers identity))
          (response ()))))

    (GET "/instances" request
      (let [flow-instances (let [roles (get-in request [:jwt-claims "realm_access" "roles"])]
                             (->> roles
                                  (map #(second (re-find #"akvo:flow:(.+?):" %)))
                                  (remove nil?)))]
        (response {:instances flow-instances})))))
