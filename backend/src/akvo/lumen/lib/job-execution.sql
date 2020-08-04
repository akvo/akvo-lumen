-- :name insert-data-source :! :n
INSERT INTO data_source(id, spec)
     VALUES (:id, :spec::jsonb);

-- :name insert-job-execution :! :n
INSERT INTO job_execution(id, data_source_id, type)
     VALUES (:id, :data-source-id, 'IMPORT');

-- :name insert-dataset-update-job-execution :! :n
INSERT INTO job_execution(id, data_source_id, dataset_id, type)
     VALUES (:id, :data-source-id, :dataset-id, 'UPDATE');

-- :name clone-data-table :! :n
-- :doc Clone a data table
CREATE TABLE :i:to-table (LIKE :i:from-table INCLUDING ALL);
INSERT INTO :i:to-table SELECT * FROM :i:from-table;

-- :name data-source-spec-by-job-execution-id :? :1
-- :doc Get the data source spec by job execution id
SELECT spec
  FROM data_source, job_execution
 WHERE data_source.id = job_execution.data_source_id
   AND job_execution.id = :job-execution-id;

-- :name update-failed-job-execution :! :n
-- :doc Update failed job execution
UPDATE job_execution
   SET error_log = :reason,
       status = 'FAILED',
       modified=current_timestamp
 WHERE id = :id;

-- :name update-successful-job-execution :! :n
-- :doc Update successful job execution
UPDATE job_execution
   SET status = 'OK',
       modified=current_timestamp
 WHERE id = :id;

-- :name update-job-execution :! :n
-- :doc Update successful job execution
UPDATE job_execution
   SET status = :status,
       dataset_id = :dataset-id,
       modified=current_timestamp
 WHERE id = :id;


-- :name job-execution-by-id :? :1
SELECT j.id, j.status, j.error_log->>0 as "error-message", j.type as kind, dataset_id as "dataset-id", data_source_id as "data-source-id"
  FROM job_execution j
   WHERE j.id = :id;


-- :name datasource-job-execution-by-id :? :1
SELECT j.dataset_id, j.data_source_id, j.status, j.error_log->>0 as "error-message", d.spec->'source'->>'kind' as kind
  FROM data_source d, job_execution j
 WHERE d.id = j.data_source_id
   AND j.id = :id;

-- :name dataset-id-by-job-execution-id :? :1
-- :doc Find the dataset id corresponding to the job execution id
SELECT dataset_id
  FROM dataset_version
  WHERE dataset_version.job_execution_id = :id;


-- :name raster-id-by-job-execution-id :? :1
-- :doc Find a raster id corresponding to the job execution id
SELECT id AS raster_id
  FROM raster_dataset
 WHERE raster_dataset.job_execution_id = :id;

-- :name job-execution-status :? :1
-- :doc Get job execution status for a given job execution id
SELECT status
  FROM job_execution
 WHERE id = :id;

-- :name delete-failed-job-execution-by-id :! :n
-- :doc delete failed job execution by id
DELETE
  FROM job_execution
 WHERE id = :id AND status = 'FAILED';
