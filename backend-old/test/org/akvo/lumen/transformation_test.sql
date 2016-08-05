

-- :name new-test-table :!
CREATE TABLE IF NOT EXISTS ds_test_1 (
  rnum serial,
  c1 jsonb,
  c2 jsonb,
  c3 jsonb
)

-- :name rollback-test-data :!
DELETE FROM dataset;
DROP TABLE IF EXISTS ds_test_1 CASCADE;

-- :name new-test-data :! :n
INSERT INTO ds_test_1 (c1, c2, c3)
VALUES ('"test1"'::jsonb, '"10"'::jsonb, '"2016-01-01"'::jsonb);
INSERT INTO dataset (id, title) VALUES ('ds-1', 'My dataset');
INSERT INTO job_execution(id, type, status) VALUES('job-1', 'IMPORT','OK');
INSERT INTO dataset_version(id, dataset_id, job_execution_id, table_name, imported_table_name, version, columns)
VALUES ('dv-1', 'ds-1', 'job-1', 'ds_test_1', 'ds_test_1', 1,
'[{"sort":null,"type":"text","title":"Column 1","hidden":false,"direction":null,"columnName":"c1"},{"sort":null,"type":"text","title":"Column 2","hidden":false,"direction":null,"columnName":"c2"},{"sort":null,"type":"text","title":"Column 3","hidden":false,"direction":null,"columnName":"c3"}]'::jsonb);


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
