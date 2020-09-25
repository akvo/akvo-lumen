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
            [akvo.lumen.lib.import.flow :as i.flow]
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
        {:strs [rqg]} (env/all conn)
        grouped-columns (group-by :groupId columns)]
    (db.dataset-version/new-dataset-version-2 conn
                                              {:id dataset-version-id
                                               :dataset-id dataset-id
                                               :job-execution-id job-execution-id
                                               :author claims
                                               :version 1
                                               :transformations []})
    (doseq [[group-id cols] grouped-columns]
      (let [imported-table-name (util/gen-table-name "imported")
            table-name (get group-table-names group-id)
            instance-id-col (->> "metadata"
                                 grouped-columns
                                 (filter #(= (:id %) "instance_id"))
                                 first)]
        (db.job-execution/clone-data-table conn
                                           {:from-table table-name
                                            :to-table imported-table-name}
                                           {}
                                           {:transaction? false})
        (db.dataset-version/new-data-group  conn
                                            {:id (util/squuid)
                                             :dataset-version-id dataset-version-id
                                             :imported-table-name imported-table-name
                                             :table-name table-name
                                             :group-id group-id
                                             :group-name (:groupName (first cols) group-id)
                                             :columns (mapv (fn [{:keys [title id type key multipleType multipleId groupName groupId namespace hidden]}]
                                                              {:columnName id
                                                               :direction nil
                                                               :groupId groupId
                                                               :groupName groupName
                                                               :namespace namespace
                                                               :hidden (boolean hidden)
                                                               :key (boolean key)
                                                               :multipleId multipleId
                                                               :multipleType multipleType
                                                               :sort nil
                                                               :title (string/trim title)
                                                               :type type})
                                                            cols)})))))

(defn execute [conn job-execution-id data-source-id dataset-id claims spec import-config]
  (with-open [importer (common/datagroups-importer (get spec "source") (assoc import-config :environment (env/all conn)))]
    (let [rows               (p/records importer)
          columns            (map (fn [c] (-> c
                                              (update :groupName (fn [groupName] (or groupName "main")))
                                              (update :groupId (fn [groupId] (or groupId "main")))))
                                  (p/columns importer))
          group-table-names  (let [group-ids (distinct (map :groupId columns))]
                               (reduce #(assoc % %2 (util/gen-table-name "ds")) {} group-ids))]
      (doseq [[groupId cols] (group-by :groupId columns)]
        (postgres/create-dataset-table conn (get group-table-names groupId) cols))
      (doseq [response (take common/rows-limit rows)]
        (log/error response)
        (doseq [[groupId iterations] response]
          (let [table-name (get group-table-names groupId)]
            (jdbc/insert-multi! conn table-name (mapv postgres/coerce-to-sql iterations)))))
      (postgres/create-data-group-foreign-keys conn group-table-names)
      (successful-execution conn job-execution-id  data-source-id dataset-id
                            group-table-names columns {:spec-name        (get spec "name")
                                                       :spec-description (get spec "description" "")} claims))))
