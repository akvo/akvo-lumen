-- :name all-tenants :? :*
-- :doc Get tenants
SELECT *
FROM tenants


-- :name all-scatters-and-table-related :? :*
-- :doc Get ...
SELECT visualisation.name, visualisation.id, visualisation.type, visualisation.dataset_id, author::json->'email' as email, table_name, visualisation.spec
FROM visualisation
JOIN dataset_version on visualisation.dataset_id = dataset_version.dataset_id
where type in ('scatter', 'bubble', 'line') 
and version = (SELECT max(version)
                  FROM dataset_version
                 WHERE dataset_version.dataset_id=visualisation.dataset_id)
and (spec::json->'version')::text = '1'


-- :name count-by-table :? :1
-- :doc Get ...
SELECT count(*) FROM :i:table_name
