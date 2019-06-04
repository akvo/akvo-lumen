-- :name all-datasets :? :*
-- :doc All datasets. Including pending datasets and datasets that failed to import
WITH
source_data AS (
 SELECT dataset.id as dataset_id, (spec->'source')::jsonb - 'refreshToken' as source
   FROM data_source, dataset_version, job_execution, dataset
  WHERE dataset_version.dataset_id = dataset.id
    AND dataset_version.version = 1
    AND dataset_version.job_execution_id = job_execution.id
    AND job_execution.data_source_id = data_source.id
),
failed_imports AS (
  --TODO name->title
  SELECT j.id, d.spec->>'name' AS name, j.error_log->>0 AS error_log, j.status, j.created, j.modified, '{}'::jsonb AS author, '{}'::jsonb AS source
    FROM data_source d, job_execution j
   WHERE j.data_source_id = d.id
     AND j.type = 'IMPORT'
     AND j.status = 'FAILED'
     AND d.spec->'source'->>'kind' != 'GEOTIFF'
),
pending_imports AS (
  SELECT j.id, d.spec->>'name' AS name, j.status, j.created, j.modified, '{}'::jsonb AS author, '{}'::jsonb AS source
    FROM data_source d, job_execution j
   WHERE j.data_source_id = d.id
     AND j.type = 'IMPORT'
     AND j.status = 'PENDING'
     AND d.spec->'source'->>'kind' != 'GEOTIFF'
)
SELECT id, name, error_log as reason, status, modified, created, '{}'::jsonb AS author, '{}'::jsonb AS source
  FROM failed_imports
 UNION
SELECT id, name, NULL, status, modified, created, '{}'::jsonb AS author, '{}'::jsonb AS source
  FROM pending_imports
 UNION
SELECT id, title, NULL, 'OK', modified, created, author, source_data.source::jsonb
  FROM dataset, source_data
  WHERE source_data.dataset_id = dataset.id;


-- :name insert-dataset :! :n
-- :doc Insert new dataset
INSERT INTO dataset(id, title, description, author)
VALUES (:id, :title, :description, :author);

-- :name delete-dataset-by-id :! :n
-- :doc delete dataset
DELETE FROM dataset WHERE id=:id;

-- :name select-datasets-by-id :? :*
-- :doc select datasets by id
SELECT * from dataset WHERE id IN (:v*:ids);

-- :name update-dataset-meta :! :n
-- :doc update dataset meta
UPDATE dataset SET title = :title WHERE id = :id;

-- :name dataset-by-id :? :1
WITH
source_data AS (
SELECT (spec->'source')::jsonb - 'refreshToken' as source
  FROM data_source, dataset_version, job_execution, dataset
 WHERE dataset_version.dataset_id = dataset.id
   AND dataset_version.version = 1
   AND dataset_version.job_execution_id = job_execution.id
   AND job_execution.data_source_id = data_source.id
   AND dataset_version.dataset_id=:id
)
SELECT dataset_version.table_name AS "table-name",
       dataset.title,
       dataset.created,
       dataset.modified,
       dataset.id,
       dataset.author,
       source_data.source,
       dataset_version.created AS "updated",
       dataset_version.columns,
       dataset_version.transformations
  FROM dataset_version, dataset, source_data
 WHERE dataset_version.dataset_id=:id
   AND dataset.id=dataset_version.dataset_id
   AND version=(SELECT max(version)
                  FROM dataset_version
                 WHERE dataset_version.dataset_id=:id);

-- :name table-name-and-columns-by-dataset-id :? :1
SELECT dataset_version.table_name AS "table-name",
       dataset_version.columns
  FROM dataset_version, dataset
 WHERE dataset_version.dataset_id=:id
   AND dataset.id=dataset_version.dataset_id
   AND version=(SELECT max(version)
                  FROM dataset_version
                 WHERE dataset_version.dataset_id=:id);

-- :name table-name-by-dataset-id :? :1
SELECT dataset_version.table_name AS "table-name"
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

-- :name count-vals-by-column-name :? :*
SELECT COUNT(*) as counter, :i:column-name as coincidence
  FROM :i:table-name
  GROUP BY coincidence
  ORDER BY counter DESC
  --~ (when (:limit params) "LIMIT :i:limit")



-- :name count-num-vals-by-column-name :? :1
SELECT COUNT(*) as "all", max(:i:column-name) as "max", min(:i:column-name) as "min"
  FROM :i:table-name


-- :name count-unique-vals-by-colum-name :? :1
select COUNT(DISTINCT :i:column-name) as "uniques" from :i:table-name
