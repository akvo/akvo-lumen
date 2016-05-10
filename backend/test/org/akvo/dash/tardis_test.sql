-- :name all-tenants :? :*
-- :doc Get all tenants
SELECT * FROM tenants;

-- :name insert-dataset :<! :n
-- :doc Insert new dataset
INSERT INTO dataset (id, title, description, transaction_log)
VALUES (:id, :title, :description, :transaction_log::jsonb)
RETURNING *;

-- :name count-history-dataset-by-ts ::? :1
-- :doc Number of records in history.dataset by timestamp
SELECT COUNT(*) FROM history.dataset WHERE _validrange @> :now::timestamptz;

-- :name history-dataset-by-ts ::? :n
-- :doc Get history.dataset record by timestamp
SELECT * FROM history.dataset WHERE _validrange @> :now::timestamptz;

-- :name history-dataset-by-transaction-log ::? :n
-- :doc Get history.dataset record by transaction_log
SELECT * FROM history.dataset WHERE transaction_log = :transaction_log::jsonb;

-- :name update-dataset :! :n
-- :doc Update dataset
UPDATE dataset
SET transaction_log = :transaction_log::jsonb
WHERE id = :id;

-- :name count-all-history-datasets ::? :1
-- :doc Total number of records in history.dataset
SELECT COUNT(*) FROM history.dataset;

-- :name delete-dataset-by-id :! :n
-- :doc Delete dataset by id
DELETE FROM dataset WHERE id = :id;

