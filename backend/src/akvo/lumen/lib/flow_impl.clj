(ns org.akvo.lumen.lib.flow-impl
  (:require [clojure.set :as set]
            [hugsql.core :as hugsql]
            [org.akvo.lumen.import.flow :as flow-import]
            [ring.util.response :refer [response]]))


(hugsql/def-db-fns "org/akvo/lumen/import/flow.sql")


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

(defn folder-and-surverys [claims flow-report-database-url org-id]
  (let [root-ids (flow-import/root-ids org-id claims)]
    (if-not (empty? root-ids)
      (response
       (remove-empty-folders
        (descendant-folders-and-surveys-by-folder-id
         (format flow-report-database-url org-id)
         {:folder-ids root-ids}
         {}
         {:identifiers identity})))
      (response ()))))

(defn instances [claims]
  (response
   {:instances (let [roles (get-in claims ["realm_access" "roles"])]
                 (->> roles
                      (map #(second (re-find #"akvo:flow:(.+?):" %)))
                      (remove nil?)
                      set))}))
