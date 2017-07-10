-- :name all-datasets :? :*
-- :doc All datasets. Including pending datasets and datasets that failed to import
WITH
failed_imports AS (
         --TODO name->title
  SELECT j.id, d.spec->>'name' AS name, j.error_log->>0 AS error_log, j.status, j.created, j.modified
    FROM data_source d, job_execution j
   WHERE j.data_source_id = d.id
     AND j.type = 'IMPORT'
     AND j.status = 'FAILED'
),
pending_imports AS (
  SELECT j.id, d.spec->>'name' AS name, j.status, j.created, j.modified
    FROM data_source d, job_execution j
   WHERE j.data_source_id = d.id
     AND j.type = 'IMPORT'
     AND j.status = 'PENDING'
)
SELECT id, name, error_log as reason, status, modified, created
  FROM failed_imports
 UNION
SELECT id, name, NULL, status, modified, created
  FROM pending_imports
 UNION
SELECT id, title, NULL, 'OK', modified, created
  FROM dataset;

-- :name delete-dataset-by-id :! :n
-- :doc delete dataset
DELETE FROM dataset WHERE id=:id;

-- :name update-dataset-data :! :n
-- :doc Update dataset with data
UPDATE datasets
SET d = :d::jsonb, status = :status
WHERE id = :id;

-- :name update-dataset-name :! :n
-- :doc Update dataset name
UPDATE datasets
SET "name" = :name
WHERE id = :id;

-- :name dataset-by-id :? :1
SELECT dataset_version.table_name AS "table-name",
       dataset.title,
       dataset.created,
       dataset.modified,
       dataset.id,
       dataset_version.columns,
       dataset_version.transformations
  FROM dataset_version, dataset
 WHERE dataset_version.dataset_id=:id
   AND dataset.id=dataset_version.dataset_id
   AND version=(SELECT max(version)
                  FROM dataset_version
                 WHERE dataset_version.dataset_id=:id);

-- :name imported-dataset-columns-by-dataset-id :? :1
SELECT dataset_version.columns
  FROM dataset_version
 WHERE dataset_id = :dataset-id
   AND version = 1;

-- :name data-source-by-dataset-id :? :1
SELECT data_source.*
  FROM data_source, dataset_version, job_execution
 WHERE dataset_version.dataset_id = :dataset-id
   AND dataset_version.job_execution_id = job_execution.id
   AND job_execution.type = 'IMPORT'
   AND job_execution.status = 'OK'
   AND job_execution.data_source_id = data_source.id;
