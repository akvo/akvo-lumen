-- :name update-dataset-data :! :n
-- :doc Update dataset with data
UPDATE datasets
SET d = :d::jsonb, status = :status
WHERE id = :id;

-- :name insert-dataset :! :n
-- :doc Insert new dataset
INSERT INTO dataset(id, title, description, settings) 
VALUES (:id, :title, :description, :settings::jsonb)


-- :name insert-dataset-version :! :n
-- :doc Insert new dataset version
INSERT INTO dataset_version(id, dataset_id, version, table_name)
VALUES (:id, :dataset-id, :version, :table-name)


-- :name insert-dataset-column :! n
-- :doc Insert new dataset column
INSERT INTO dataset_column(id, dataset_id, type, title, column_name, column_order)
VALUES (:id, :dataset-id, :type, :title, :column-name, :column-order)


-- :name insert-dataset-columns :! n
-- :doc Insert new dataset columns with *tuple parameters
INSERT INTO dataset_column(id, dataset_id, type, title, column_name, column_order)
VALUES :tuple*:columns
