-- :name get-table-name :? :1
SELECT table_name AS "table-name"
  FROM dataset_version
 WHERE job_execution_id = :job-id

-- :name get-val-from-table :? :1
SELECT :i:column-name
  FROM :i:table-name
 WHERE rnum = :rnum

-- :name get-row-count ?: :1
SELECT COUNT(*) AS total
  FROM :i:table-name

-- :name get-data :? :*
SELECT * FROM :i:table-name order by rnum

-- :name table-exists :? :1
SELECT EXISTS (
  SELECT 1
  FROM pg_tables
  WHERE tablename = :table-name
);
