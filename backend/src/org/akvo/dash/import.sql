-- :name update-dataset-data :! :n
-- :doc Update dataset with data
UPDATE dataset
SET d = :d::jsonb, status = :status
WHERE id = :id;

-- :name insert-dataset :! :n
-- :doc Insert new dataset
INSERT INTO dataset(id, name) VALUES (:id, :name)


-- :name insert-dataset-version :! :n
-- :doc Insert new dataset version
INSERT INTO dataset_version(id, dataset_id, table_name)
VALUES (:id, :dataset-id, :table-name)


-- :name insert-dataset-column :! n
-- :doc Insert new dataset column
INSERT INTO dataset_column(id, dataset_id, type, c_name, c_order)
VALUES (:id, :dataset-id, :type, :c-name, :c-order)


-- :name insert-dataset-columns :! n
-- :doc Insert new dataset columns with *tuple parameters
INSERT INTO dataset_column(id, dataset_id, type, name, c_name, c_order)
VALUES :tuple*:columns
