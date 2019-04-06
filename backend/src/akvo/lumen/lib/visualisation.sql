-- :name all-visualisations :? :*
-- :doc All visualisations.
SELECT id, dataset_id as "datasetId", "name", "type" as "visualisationType", spec, created, modified, author
FROM visualisation
where true 
--~ (when (coll? (:auth-visualisations params)) (if (seq (:auth-visualisations params)) "AND id IN (:v*:auth-visualisations)" "AND id = 'no-ds-id'"))
;

-- :name all-maps-visualisations-with-dataset-id :? :*
-- :doc All maps visualisations with dataset-ids.
select  id, replace(((jsonb_array_elements(spec->'layers')->'datasetId')::text), '"', '') as "datasetId"  from visualisation where type='map';

-- :name all-no-maps-visualisations :? :*
-- :doc All no maps visualisations with dataset-ids.
select id, dataset_id as "datasetId" from visualisation where type!='map'
--~ (when (coll? (:auth-datasets params)) (if (seq (:auth-datasets params)) "AND dataset_id IN (:v*:auth-datasets)" "AND dataset_id = 'no-ds-id'"))
;

-- :name visualisation-by-id :? :1
-- :doc grab visualisation by id
WITH auth AS (
--~ (if (coll? (:auth-visualisations params)) "select count (*) where :id = ANY(ARRAY [:v*:auth-visualisations]::text[])" "select 1 as count")
)
SELECT id, dataset_id as "datasetId", "name", "type" as "visualisationType", spec, created, modified
FROM visualisation, auth
WHERE id = :id and auth.count>0;

-- :name delete-visualisation-by-id :! :n
-- :doc delete visualisation by id
WITH auth AS (
--~ (if (coll? (:auth-visualisations params)) "select count (*) where :id = ANY(ARRAY [:v*:auth-visualisations]::text[])" "select 1 as count")
)
DELETE FROM visualisation USING auth WHERE id = :id and auth.count>0;


-- :name delete-maps-by-dataset-id :! :n
-- :doc delete maps by dataset id
DELETE FROM visualisation WHERE spec::varchar LIKE concat('%', :id, '%')
--~ (when (coll? (:auth-visualisations params)) (if (seq (:auth-visualisations params)) "AND id IN (:v*:auth-visualisations)" "AND id = 'no-ds-id'"))
;


-- :name create-visualisation :<!
-- :doc Create a single visualisation
/*~(if (:dataset-id params) (if (contains? (set (:auth-datasets params)) (:dataset-id params)) */
INSERT INTO visualisation (id, dataset_id, "name", "type", spec, author)
VALUES (:id, :dataset-id, :name, :type, :spec, :author)
RETURNING *;
/*~*/
SELECT NULL;
/*~ ) */
INSERT INTO visualisation (id, "name", "type", spec, author)
VALUES (:id, :name, :type, :spec, :author)
RETURNING *;

/*~ ) ~*/

-- :name update-visualisation :<!
-- :doc Upsert a single visualisation
WITH auth AS (
--~ (if (:dataset-id params) (if (coll? (:auth-datasets params)) "select count (*) where :dataset-id = ANY(ARRAY [:v*:auth-datasets]::text[])" "select 1 as count") "select 1 as count")
)
UPDATE visualisation
SET dataset_id = :dataset-id,
    "name" = :name,
    "type" = :type,
    spec = :spec
    FROM auth
    where id=:id and auth.count>0
RETURNING *;
