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
SELECT id, dataset_id as "datasetId", "name", "type" as "visualisationType", spec, created, modified
FROM visualisation
WHERE id = :id 
--~ (when (coll? (:auth-visualisations params)) (if (seq (:auth-visualisations params)) "AND id IN (:v*:auth-visualisations)" "AND id = 'no-ds-id'"))

;

-- :name delete-visualisation-by-id :! :n
-- :doc delete visualisation by id
DELETE FROM visualisation WHERE id = :id 
--~ (when (coll? (:auth-visualisations params)) (if (seq (:auth-visualisations params)) "AND id IN (:v*:auth-visualisations)" "AND id = 'no-ds-id'"))
;

-- :name delete-maps-by-dataset-id :! :n
-- :doc delete maps by dataset id
DELETE FROM visualisation WHERE spec::varchar LIKE concat('%', :id, '%')
--~ (when (coll? (:auth-visualisations params)) (if (seq (:auth-visualisations params)) "AND id IN (:v*:auth-visualisations)" "AND id = 'no-ds-id'"))
;

-- :name upsert-visualisation :<!
-- :doc Upsert a single visualisation
INSERT INTO visualisation (id, dataset_id, "name", "type", spec, author)
VALUES (:id, :dataset-id, :name, :type, :spec, :author)
ON CONFLICT (id)
DO UPDATE SET dataset_id = :dataset-id,
              "name" = :name,
              "type" = :type,
              spec = :spec
RETURNING *;
