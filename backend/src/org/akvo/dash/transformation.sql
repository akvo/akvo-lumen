
-- :name new-job-execution :! :n
-- :doc Inserts a new transformation job execution
INSERT INTO job_execution (id, dataset_id, type)
VALUES (:id, :dataset-id, 'TRANSFORMATION')

-- :name update-transformations :! :n
-- :doc Updates the transformations property for a given dataset
UPDATE dataset
   SET transformations = :transformations::jsonb
 WHERE id = :dataset-id


-- :name dataset-by-id :? :1
-- :doc Checks the existence of a dataset for a given id
SELECT id FROM dataset WHERE id = :id

-- :name dataset-version-by-id :? :1
-- :doc Returns the most recent dataset version for a given dataset id
SELECT imported_table_name AS "imported-table-name", columns, version
  FROM dataset_version
 WHERE dataset_id = :id
   AND version = (SELECT MAX(v.version)
                    FROM dataset_version v
                   WHERE v.dataset_id = :id);


-- :name update-job-success-execution :! :n
-- :doc Updates a job_execution with a given log
UPDATE job_execution
   SET execution_log = :exec-log,
       status = 'OK'
 WHERE id = :id

-- :name update-job-failed-execution :! :n
-- :doc Updates a job_execution with a given log
UPDATE job_execution
   SET error_log = :error-log,
       status = 'FAILED'
 WHERE id = :id

-- :name new-dataset-version :! :n
-- :doc Inserts a new dataset version
INSERT INTO dataset_version (id, dataset_id, job_execution_id, version,
                             table_name, imported_table_name, columns)
VALUES (:id, :dataset-id, :job-execution-id, :version,
        :table-name, :imported-table-name, :columns::jsonb)


-- :name copy-table :!
-- :doc Copy a table defition (including data)
CREATE TABLE :i:dest-table AS TABLE :i:source-table
