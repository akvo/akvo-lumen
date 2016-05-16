-- :name all-visualisations :? :*
-- :doc All visualisations.
SELECT id, name, spec, created, modified
FROM visualisation;

-- :name visualisation-by-id :? :1
-- :doc grab visualisation by id
SELECT * FROM visualisation
WHERE id = :id;

-- :name delete-visualisation-by-id :! :n
-- :doc delete visualisation by id
DELETE FROM visualisation WHERE id = :id;

-- :name insert-visualisation :<!
-- :doc Insert a single visualisations
INSERT INTO visualisation (id, "name", dataset_id, spec, author)
VALUES (:id, :name, :dataset-id, :spec::jsonb, :author::jsonb)
RETURNING *;
