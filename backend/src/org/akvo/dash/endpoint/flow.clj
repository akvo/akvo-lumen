(ns org.akvo.dash.endpoint.flow
  (:require [clojure.string :as str]
            [clojure.set :as set]
            [compojure.core :refer :all]
            [ring.util.response :refer (response)]
            [hugsql.core :as hugsql]
            [org.akvo.dash.import.flow :as flow-import]))


(hugsql/def-db-fns "org/akvo/dash/import/flow.sql")

(defn remove-empty-folders
  "Remove empty folders"
  [folders-and-surveys]
  (loop [fas folders-and-surveys]
    (let [folder-ids (set (map :folderId fas))
          next-fas (remove #(and (= (:type %) "folder")
                                 (not (folder-ids (:id %))))
                           fas)]
      (if (= (count fas) (count next-fas))
        fas
        (recur next-fas)))))

(defn endpoint [{{:keys [flow-report-database-url]} :config}]
  (context "/api/flow" _
    (GET "/folders-and-surveys/:org-id" request
      (let [org-id (-> request :params :org-id)
            root-ids (flow-import/root-ids org-id (:jwt-claims request))]
        (if-not (empty? root-ids)
          (response (remove-empty-folders
                     (descendant-folders-and-surveys-by-folder-id
                      (format flow-report-database-url org-id)
                      {:folder-ids root-ids}
                      {}
                      :identifiers identity)))
          (response ()))))

    (GET "/instances" request
      (let [flow-instances (let [roles (get-in request [:jwt-claims "realm_access" "roles"])]
                             (->> roles
                                  (map #(second (re-find #"akvo:flow:(.+?):" %)))
                                  (remove nil?)
                                  set))]
        (response {:instances flow-instances})))))
