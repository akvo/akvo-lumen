-- :name all-collections
-- :doc List all collections. Collection entities are not included.
SELECT collection.id,
       collection.title,
       collection.created,
       collection.modified,
       array_remove(array_agg(coalesce(
           collection_entity.visualisation_id,
           collection_entity.dataset_id,
           collection_entity.dashboard_id,
           collection_entity.raster_dataset_id
       )), NULL) AS entities
FROM collection
LEFT JOIN collection_entity ON collection_entity.collection_id = collection.id
GROUP BY collection.id;

-- :name auth-collection-ids
-- :doc List all authed-collections ids Collection entities are not included.
select collection.id
from  collection
LEFT JOIN collection_entity ON collection_entity.collection_id = collection.id
where dataset_id IN (:v*:dataset-ids) OR visualisation_id IN (:v*:visualisation-ids) OR dashboard_id IN (:v*:dashboard-ids) OR raster_dataset_id IS NOT  NULL
GROUP BY collection.id;

-- :name create-collection :<! :1
-- :doc Create an empty collection. Title must be unique. Returns the id.
INSERT INTO collection (title) VALUES (:title) RETURNING *;

-- :name fetch-collection :? :1
-- :doc Fetch a collection including the collection entities
SELECT collection.id,
       collection.title,
       collection.created,
       collection.modified,
       array_remove(array_agg(coalesce(
           collection_entity.visualisation_id,
           collection_entity.dataset_id,
           collection_entity.dashboard_id,
           collection_entity.raster_dataset_id
       )), NULL) AS entities
FROM collection
LEFT JOIN collection_entity ON collection_entity.collection_id = collection.id
WHERE collection.id = :id
GROUP BY collection.id;

-- :name update-collection-title :!
-- :doc Update the collection title
UPDATE collection SET title=:title WHERE id=:id

-- :name insert-collection-entity :!
-- :doc insert a collection entity. Specify exactly one of :dataset-id,
--      :visualisation-id or :dashboard-id
INSERT INTO collection_entity (
    collection_id,
    dataset_id,
    visualisation_id,
    dashboard_id,
    raster_dataset_id
) VALUES (
    :collection-id,
    :dataset-id,
    :visualisation-id,
    :dashboard-id,
    :raster-dataset-id
);

-- :name fetch-collection-entities
-- :doc Fetch collection entity ids. Returns a sequence of maps with
--      keys :dataset-id :visualisation-id and :dashboard-id only one
--      of which is non-nil.
SELECT dataset_id AS "dataset-id"
       visualisation_id AS "visualisation-id"
       dashboard_id AS "dashboard-id"
       raster_dataset_id AS "raster-dataset-id"
FROM collection_entity
WHERE collection_id = :id;

-- :name fetch-dataset-ids
SELECT id AS "dataset-id" FROM dataset WHERE id=ANY(:ids)

-- :name fetch-visualisation-ids
SELECT id AS "visualisation-id" FROM visualisation WHERE id=ANY(:ids)

-- :name fetch-dashboard-ids
SELECT id AS "dashboard-id" FROM dashboard WHERE id=ANY(:ids)

-- :name fetch-raster-dataset-ids
SELECT id AS "raster-dataset-id" FROM raster_dataset WHERE id=ANY(:ids)

-- :name delete-collection :!
-- :doc Delete a collection, including all entities
DELETE FROM collection WHERE id = :id;

-- :name delete-collection-entities :!
-- :doc Delete collection entities for a collection leaving it empty
DELETE FROM collection_entity WHERE collection_id = :id;
