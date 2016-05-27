-- :name insert-data-source :! :n
INSERT INTO data_source(id, spec)
     VALUES (:id, :spec::jsonb);

-- :name insert-job-execution :! :n
INSERT INTO job_execution(id, data_source_id, type)
     VALUES (:id, :data-source-id, 'IMPORT')

-- :name insert-dataset :! :n
-- :doc Insert new dataset
INSERT INTO dataset(id, title, description)
VALUES (:id, :title, :description)

-- :name insert-dataset-version :! :n
-- :doc Insert new dataset version
INSERT INTO dataset_version(id, dataset_id, job_execution_id, table_name, imported_table_name, version, columns)
VALUES (:id, :dataset-id, :job-execution-id, :table-name, :imported-table-name, :version, :columns)

-- :name clone-data-table :! :n
-- :doc Clone a data table
CREATE TABLE :i:to-table AS TABLE :i:from-table

-- :name data-source-spec-by-job-execution-id :? :1
-- :doc Get the data source spec by job execution id
SELECT spec
  FROM data_source, job_execution
 WHERE data_source.id = job_execution.data_source_id
   AND job_execution.id = :job-execution-id

-- :name update-failed-job-execution :! :n
-- :doc Update failed job execution
UPDATE job_execution
   SET modified=now(),
       log=:reason
 WHERE id=:id

-- :name update-successful-job-execution :! :n
-- :doc Update successful job execution
UPDATE job_execution
   SET finished_at=now()
 WHERE id=:id

-- :name job-execution-by-id :? :1
SELECT *
  FROM job_execution
 WHERE id=:id

-- :name dataset-id-by-job-execution-id :? :1
-- :doc Find the dataset id corresponding to the job execution id
SELECT dataset_id
  FROM dataset_version
 WHERE dataset_version.job_execution_id=:id
