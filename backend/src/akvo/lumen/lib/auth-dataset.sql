-- :name auth-all-datasets :? :*
-- :doc All datasets. Including pending datasets and datasets that failed to import
WITH
source_data AS (
 SELECT dataset.id as dataset_id, (spec->'source')::jsonb - 'refreshToken' as source
   FROM data_source, dataset_version, job_execution, dataset
  WHERE dataset_version.dataset_id = dataset.id
    AND dataset_version.version = 1
    --~ (when (seq (:auth-datasets params)) "AND dataset.id IN (:v*:auth-datasets)") 
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
