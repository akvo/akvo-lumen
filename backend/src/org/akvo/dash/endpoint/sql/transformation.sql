-- :name insert-transformation :! :n
-- :doc Insert a transformation
INSERT INTO transformations (id, fns)
VALUES (:id, :fns::jsonb)


-- :name transformation-by-id :? :1
SELECT *
FROM transformations
WHERE id = :id

-- :name update-transformation :! :n
UPDATE transformations
SET fns = :fns
WHERE id = :id
