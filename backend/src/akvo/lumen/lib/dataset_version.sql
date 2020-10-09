-- :name db-new-dataset-version :! :n
-- :doc Inserts a new dataset version
INSERT INTO dataset_version (id, dataset_id, job_execution_id, version,
                             table_name, imported_table_name,
                             transformations, columns, namespace)
VALUES (:id, :dataset-id, :job-execution-id, :version,
        :table-name, :imported-table-name, :transformations, :columns, :namespace)

-- :name db-new-dataset-version-2 :! :n
-- :doc Inserts a new dataset version 2
INSERT INTO dataset_version_2 (id, dataset_id, job_execution_id, version, transformations, author)
VALUES (
       :id,
       :dataset-id,
       :job-execution-id,
       :version,
       :transformations,
       (SELECT jsonb_object_agg(key, value) FROM jsonb_each(:author) WHERE key IN ('name', 'given_name', 'family_name', 'email'))
);

-- :name db-dataset-version-2-by-dataset-id-and-version :? :1
-- :doc Returns the most recent dataset version 2 for a given dataset id and version
SELECT id, version, transformations
  FROM dataset_version_2
 WHERE dataset_id = :dataset-id
   AND version = :version;



-- :name db-latest-dataset-version-2-by-dataset-id :? :1
-- :doc Returns the most recent dataset version 2 for a given dataset id
SELECT id, version, transformations
  FROM dataset_version_2
 WHERE dataset_id = :dataset-id
   AND version = (SELECT MAX(v.version)
                    FROM dataset_version_2 v
                   WHERE v.dataset_id = :dataset-id);
