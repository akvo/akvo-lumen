-- :name all-visualisations :? :*
-- :doc All visualisations.
SELECT id, name, spec, created, modified
FROM visualisation;

-- :name visualisation-by-id :? :1
-- :doc grab visualisation by id
SELECT * FROM visualisation
WHERE id = :id;

-- :name insert-visualisation :<!
-- :doc Insert a single visualisations
INSERT INTO visualisation (id, "name", spec, author)
VALUES (:id, :name, :spec::jsonb, :author::jsonb)
RETURNING *;
