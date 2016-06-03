-- :name all-visualisations :? :*
-- :doc All visualisations.
SELECT id, dataset_id as "datasetId", "name", "type" as "visualisationType", spec, created, modified
FROM visualisation;

-- :name visualisation-by-id :? :1
-- :doc grab visualisation by id
SELECT id, dataset_id as "datasetId", "name", "type" as "visualisationType", spec, created, modified
FROM visualisation
WHERE id = :id;

-- :name delete-visualisation-by-id :! :n
-- :doc delete visualisation by id
DELETE FROM visualisation WHERE id = :id;

-- :name upsert-visualisation :<!
-- :doc Upsert a single visualisation
INSERT INTO visualisation (id, dataset_id, "name", "type", spec, author)
VALUES (:id, :dataset-id, :name, :type, :spec, :author)
ON CONFLICT (id)
DO UPDATE SET dataset_id = :dataset-id,
              "name" = :name,
              "type" = :type,
              spec = :spec,
              author = :author
WHERE visualisation.id=:id
RETURNING *;
