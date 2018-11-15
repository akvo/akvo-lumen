-- :name delete-datasource-by-job-execution-id-and-status :! :n
-- :doc delete dataset
DELETE
  FROM data_source
 WHERE id IN (SELECT data_source_id
                FROM job_execution
               WHERE id = :id AND status = :status);
