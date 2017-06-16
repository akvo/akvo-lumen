
-- :name new-transformation-job-execution :! :n
-- :doc Inserts a new transformation job execution
INSERT INTO job_execution (id, dataset_id, type)
VALUES (:id, :dataset-id, 'TRANSFORMATION')

-- :name dataset-by-id :? :1
-- :doc Checks the existence of a dataset for a given id
SELECT id FROM dataset WHERE id = :id

-- :name latest-dataset-version-by-dataset-id :? :1
-- :doc Returns the most recent dataset version for a given dataset id
SELECT id, table_name AS "table-name", imported_table_name AS "imported-table-name", columns, version, transformations
  FROM dataset_version
 WHERE dataset_id = :dataset-id
   AND version = (SELECT MAX(v.version)
                    FROM dataset_version v
                   WHERE v.dataset_id = :dataset-id);

-- :name dataset-version-by-dataset-id :? :1
-- :doc Returns the most recent dataset version for a given dataset id
SELECT id, table_name AS "table-name", imported_table_name AS "imported-table-name", columns, version, transformations
  FROM dataset_version
 WHERE dataset_id = :dataset-id
   AND version = :version;

-- :name clear-dataset-version-data-table :! :n
-- :doc Clear the table_name for a given dataset_version id
UPDATE dataset_version
   SET table_name=NULL
 WHERE id = :id

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
INSERT INTO dataset_version (id, dataset_id, version,
                             table_name, imported_table_name,
                             transformations, columns)
VALUES (:id, :dataset-id, :version,
        :table-name, :imported-table-name, :transformations, :columns)


-- :name copy-table :!
-- :doc Copy a table defition (including data)
CREATE TABLE :i:dest-table (LIKE :i:source-table INCLUDING ALL);
INSERT INTO :i:dest-table SELECT * FROM :i:source-table;
VACUUM ANALYZE :i:dest-table;

-- :name drop-table :!
-- :doc Drop table
DROP TABLE :i:table-name CASCADE;
