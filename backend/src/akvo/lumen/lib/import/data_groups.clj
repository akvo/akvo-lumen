(ns akvo.lumen.lib.import.data-groups
  (:require [akvo.lumen.lib.import.common :as common]
            [akvo.lumen.postgres :as postgres]
            [akvo.lumen.db.job-execution :as db.job-execution]
            [akvo.lumen.db.dataset :as db.dataset]
            [akvo.lumen.db.dataset-version :as db.dataset-version]
            [akvo.lumen.db.transformation :as db.transformation]
            [akvo.lumen.protocols :as p]
            [akvo.lumen.lib.import.csv]
            [akvo.lumen.lib.env :as env]
            [akvo.lumen.lib.import.flow]
            [akvo.lumen.lib.import.csv]
            [akvo.lumen.lib.raster]
            [akvo.lumen.lib :as lib]
            [akvo.lumen.util :as util]
            [cheshire.core :as json]
            [clojure.java.jdbc :as jdbc]
            [clojure.string :as string]
            [clojure.tools.logging :as log]))

(defn- successful-execution [conn job-execution-id data-source-id group-table-names columns {:keys [spec-name spec-description]} claims]
  (let [dataset-id (util/squuid)
        dataset-version-id (util/squuid)
        {:strs [rqg]} (env/all conn)]
    (db.dataset/insert-dataset conn {:id dataset-id
                                     :title spec-name ;; TODO Consistent naming. Change on client side?
                                     :description spec-description
                                     :author claims})
    (db.dataset-version/new-dataset-version-2
     conn {:id dataset-version-id
           :dataset-id dataset-id
           :job-execution-id job-execution-id
           :version 1
           :transformations []})
    (doseq [[ns* cols] (group-by :groupId columns)]
      (let [imported-table-name (util/gen-table-name "imported")
            table-name (get group-table-names ns*)]
        (db.job-execution/clone-data-table conn
                                           {:from-table table-name
                                            :to-table imported-table-name}
                                           {}
                                           {:transaction? false})
        (db.dataset-version/new-data-group
         conn {:id (util/squuid)
               :dataset-version-id dataset-version-id
               :imported-table-name imported-table-name
               :table-name table-name
               :columns (mapv (fn [{:keys [title id type key multipleType multipleId groupName groupId namespace]}]
                                {:columnName id
                                 :direction nil
                                 :groupId groupId
                                 :groupName groupName
                                 :namespace namespace
                                 :hidden false
                                 :key (boolean key)
                                 :multipleId multipleId
                                 :multipleType multipleType
                                 :sort nil
                                 :title (string/trim title)
                                 :type type})
                              cols)})))))

(defn execute [conn job-execution-id data-source-id claims spec columns importer]
  
  (let [rows (p/records importer)
        columns           (map  (fn [c] (update c :groupId (fn [groupId] (or groupId "main")))) columns)
        
        group-ids         (distinct (map :groupId columns))
;;        {group-id: ds_table}
        group-table-names (reduce #(assoc % %2 (util/gen-table-name "ds")) {} group-ids)]
    (doseq [[groupId cols] (group-by :groupId columns)]
;; {group-id-1: [col1, col2]}    
      (postgres/create-dataset-table conn (get group-table-names groupId) cols))
    (doseq [r (take common/rows-limit rows)]
      [[{:c1 1 :c2 2} {:rq1 "a"} {:rq1 "b"}]   [{:c1 3 :c2 4} {:rq1 "c"} {:rq1 "d"}] ]
      (log/error :nuevo r)
;;      (:namespace (meta {:rq1 "a"})) ;; => "rqg-id" "main" #{metadata, group-nr1, group-nr2}
      #_(doseq [record record-namespaces]
        (let [ns* (:namespace (meta record) "main")]
          (log/error (meta record) record )
          #_(jdbc/insert! conn (get ns-table-names ns*) (postgres/coerce-to-sql record)))))
    #_(successful-execution conn job-execution-id  data-source-id
                            ns-table-names columns {:spec-name        (get spec "name")
                                                    :spec-description (get spec "description" "")} claims)))
