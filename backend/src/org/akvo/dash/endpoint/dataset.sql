-- :name all-datasets :? :*
-- :doc All datasets. Including pending datasets and datasets that failed to import
WITH
failed_imports AS (
         --TODO name->title
  SELECT j.id, d.spec->>'name' AS name, j.log AS error_reason, j.status, j.created, j.modified
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
SELECT id, name, error_reason as reason, status, modified, created
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
       dataset.transformations,
       dataset.title,
       dataset.created,
       dataset.modified,
       dataset.id,
       dataset_version.columns
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
