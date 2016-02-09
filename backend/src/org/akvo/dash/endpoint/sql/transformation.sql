-- :name insert-transformation :! :n
-- :Insert a transformation
INSERT INTO transformations (id, fns)
VALUES (:id, :fns::jsonb)
