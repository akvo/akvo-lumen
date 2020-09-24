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

(defn- successful-execution [conn job-execution-id data-source-id dataset-id group-table-names columns {:keys [spec-name spec-description]} claims]
  (let [dataset-version-id (util/squuid)
        {:strs [rqg]} (env/all conn)]
    (db.dataset-version/new-dataset-version-2
     conn {:id dataset-version-id
           :dataset-id dataset-id
           :job-execution-id job-execution-id
           :author claims
           :version 1
           :transformations []})
    (doseq [[group-id cols] (group-by :groupId columns)]
      (let [imported-table-name (util/gen-table-name "imported")
            table-name (get group-table-names group-id)]
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
               :group-id group-id
               :group-name (:groupName (first cols) group-id)
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

(defn execute [conn job-execution-id data-source-id dataset-id claims spec columns importer]
  (let [rows              (p/records importer)
        columns           (map  (fn [c] (update c :groupId (fn [groupId] (or groupId "main")))) columns)
        group-ids         (distinct (map :groupId columns))
        group-table-names (reduce #(assoc % %2 (util/gen-table-name "ds")) {} group-ids)]
    (doseq [[groupId cols] (group-by :groupId columns)]
      (postgres/create-dataset-table conn (get group-table-names groupId) cols))
    (doseq [response (take common/rows-limit rows)]
      (doseq [[groupId iterations] response]
        (let [table-name (or (get group-table-names groupId)
                             (get group-table-names "main"))]
          (doseq [iteration iterations]
            (jdbc/insert! conn  table-name (postgres/coerce-to-sql iteration))))))
    (successful-execution conn job-execution-id  data-source-id dataset-id
                          group-table-names columns {:spec-name        (get spec "name")
                                                     :spec-description (get spec "description" "")} claims)))
