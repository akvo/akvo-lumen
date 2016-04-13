-- :name update-dataset-data :! :n
-- :doc Update dataset with data
UPDATE datasets
SET d = :d::jsonb, status = :status
WHERE id = :id;
