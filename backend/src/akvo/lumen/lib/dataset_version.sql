-- :name new-dataset-version :! :n
-- :doc Inserts a new dataset version
INSERT INTO dataset_version (id, dataset_id, job_execution_id, version,
                             table_name, imported_table_name,
                             transformations, columns)
VALUES (:id, :dataset-id, :job-execution-id, :version,
        :table-name, :imported-table-name, :transformations, :columns)


-- :name insert-dataset-version :! :n
-- :doc Insert new dataset version
INSERT INTO dataset_version(id, dataset_id, job_execution_id, table_name, imported_table_name, version, columns, transformations)
VALUES (:id, :dataset-id, :job-execution-id, :table-name, :imported-table-name, :version, :columns, :transformations);

