-- :name new-transformation-job-execution :! :n
-- :doc Inserts a new transformation job execution
INSERT INTO job_execution (id, dataset_id, type)
VALUES (:id, :dataset-id, 'TRANSFORMATION')

-- :name pending-transformation-job-execution :? :1
SELECT * from job_execution
WHERE dataset_id=:dataset-id AND status='PENDING' AND type='TRANSFORMATION'


-- :name touch-dataset :! :n
-- :doc Updates the dataset's modified value to current_timestamp
UPDATE dataset
   SET modified=current_timestamp
 WHERE id = :id

-- :name dataset-by-id :? :1
-- :doc Checks the existence of a dataset for a given id
SELECT id FROM dataset WHERE id = :id

-- :name db-latest-dataset-version-by-dataset-id :? :1
-- :doc Returns the most recent dataset version for a given dataset id
SELECT id, table_name AS "table-name", imported_table_name AS "imported-table-name", columns, version, transformations
  FROM dataset_version
 WHERE dataset_id = :dataset-id
   AND ns = :ns
   AND version = (SELECT MAX(v.version)
                    FROM dataset_version v
                   WHERE v.dataset_id = :dataset-id);

-- :name latest-dataset-versions-by-dataset-ids :? :*
-- :doc Returns the most recent dataset version for a given dataset id
select DISTINCT ON (dataset_id) dataset_id, id, version, transformations, columns
FROM dataset_version
WHERE dataset_id IN (:v*:dataset-ids)
order by dataset_id, version desc;

-- :name latest-dataset-versions :? :*
-- :doc Returns the most recent dataset version for a given dataset id
select DISTINCT ON (dataset_id) dataset_id, dataset_version.id as id, version, title, transformations
FROM dataset_version, dataset
where dataset.id=dataset_id
order by dataset_id, version desc;

-- :name update-dataset-version :! :n
-- :doc Update dataset version
UPDATE dataset_version SET columns= :columns,  transformations= :transformations
where dataset_id= :dataset-id and version= :version;

-- :name initial-dataset-version-to-update-by-dataset-id :? :1
SELECT id, table_name AS "table-name", imported_table_name AS "imported-table-name", columns, version, transformations
  FROM  dataset_version
  WHERE dataset_id= :dataset-id AND transformations='[]'
  ORDER BY version DESC LIMIT 1;

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

-- :name copy-table :!
-- :doc Copy a table defition (including data)
CREATE TABLE :i:dest-table (LIKE :i:source-table INCLUDING ALL);
INSERT INTO :i:dest-table SELECT * FROM :i:source-table;

-- :name drop-table :!
-- :doc Drop table
DROP TABLE IF EXISTS :i:table-name CASCADE;

-- :name select-rnum-and-column :?
-- :doc Get only the column and the rnum
SELECT rnum, :i:column-name FROM :i:table-name

-- :name select-random-column-data :?
-- :doc Get only the column and the rnum
SELECT :i:column-name FROM :i:table-name
order by random()
limit :i:limit

-- :name select-column-data :?
-- :doc Get only the column and the rnum
SELECT :i:column-name FROM :i:table-name
