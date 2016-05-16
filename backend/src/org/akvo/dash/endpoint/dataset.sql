-- :name all-datasets :? :*
-- :doc All datasets. Including pending datasets and datasets that failed to import
WITH
failed_imports AS (
         --TODO name->title
  SELECT job_execution.id, spec->>'name' AS name, error_reason, job_execution.created, job_execution.modified
    FROM data_source, job_execution
   WHERE job_execution.data_source_id=data_source.id
     AND error_reason IS NOT NULL
),
pending_imports AS (
  SELECT job_execution.id, spec->>'name' AS name, job_execution.created, job_execution.modified
    FROM data_source, job_execution
   WHERE job_execution.data_source_id=data_source.id
     AND finished_at IS NULL
)
SELECT id, name, error_reason as reason, 'FAILED' AS status, modified, created
  FROM failed_imports
 UNION
SELECT id, name, NULL, 'PENDING', modified, created
  FROM pending_imports
 UNION
SELECT id, title, NULL, 'OK', modified, created
  FROM dataset;

-- :name insert-datasource :<!
-- :doc insert datasource
INSERT INTO datasources (id, spec)
VALUES (:id, :spec::jsonb)
RETURNING *;

-- :name insert-dataset :<!
-- :doc insert dataset
INSERT INTO datasets (id, "name", datasource, author)
VALUES (:id, :name, :datasource, :author::jsonb)
RETURNING *;

-- :name update-dataset-data :! :n
-- :doc Update dataset with data
UPDATE datasets
SET d = :d::jsonb, status = :status
WHERE id = :id;

-- :name update-dataset-name :! :n
-- :doc Update dataset name
UPDATE datasets
SET "name" = :name
WHERE id = :id



-- :name dataset-by-id :? :1
SELECT dataset_version.table_name AS "table-name",
       dataset.transaction_log AS "transaction-log",
       dataset.title,
       dataset.created,
       dataset.modified,
       dataset.id
  FROM dataset_version, dataset
 WHERE dataset_version.dataset_id=:id
   AND dataset.id=dataset_version.dataset_id
   AND version=(SELECT max(version)
                  FROM dataset_version
                 WHERE dataset_version.dataset_id=:id);

-- :name dataset-columns-by-dataset-id :? :*
SELECT title,
       type,
       column_name AS "column-name",
       column_order AS "column-order"
  FROM dataset_column
 WHERE dataset_id=:id
