-- :name all-datasets :? :*
-- :doc All datasets.
SELECT id, name, datasource, status, created, modified
FROM datasets;

-- :name insert-datasource :<!
-- :doc insert datasource
INSERT INTO datasources (id, spec)
VALUES (:id, :spec::jsonb)
RETURNING *;

-- :name insert-dataset :<!
-- :doc insert dataset
INSERT INTO datasets (id, "name", datasource, author)
VALUES (:id, :name, :datasource, :author::jsonb)
RETURNING *;

-- :name update-dataset-data :! :n
-- :doc Update dataset with data
UPDATE datasets
SET d = :d::jsonb, status = :status
WHERE id = :id;

-- :name update-dataset-name :! :n
-- :doc Update dataset name
UPDATE datasets
SET "name" = :name
WHERE id = :id

-- :name dataset-by-id :? :1
-- :doc Get dataset by id
SELECT * from datasets
WHERE id = :id
