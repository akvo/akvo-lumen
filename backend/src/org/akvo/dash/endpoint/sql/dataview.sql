-- :name insert-dataview :! :n
-- :Insert a single dataview
INSERT INTO dataview (id, dataset_name, datasource, transformation)
VALUES (:id, :dataset-name, :datasource, :transformation)

-- :name all-datasets :? :*
-- :doc Get all datasets
SELECT DISTINCT ON (v.id)
v.id AS id, v.dataset_name AS name, i.status
FROM dataview v
LEFT JOIN datasources s ON v.datasource = s.id
LEFT JOIN (
     SELECT DISTINCT ON (i.datasource)
     i.id, i.datasource, i.revision, i.status, r.noble
     FROM imports i LEFT JOIN revisions r ON i.revision = r.digest
     ORDER BY i.datasource, i.id DESC) i ON s.id = i.datasource
ORDER BY v.id DESC


-- :name dataset-by-id :? :1
-- :doc Get dataset by id
SELECT DISTINCT ON (v.id)
v.id AS id, v.dataset_name AS name, s.id AS source_id, i.id AS import_id, i.noble, t.id AS tranformation_id, t.fns, i.digest, i.status
FROM dataview v
LEFT JOIN datasources s ON v.datasource = s.id
LEFT JOIN (
     SELECT DISTINCT ON (i.datasource)
     i.id, i.datasource, i.status, i.revision, r.noble, r.digest
     FROM imports i LEFT JOIN revisions r ON i.revision = r.digest
     ORDER BY i.datasource, i.id DESC) i ON s.id = i.datasource
LEFT JOIN transformations t ON t.id = v.transformation
WHERE v.id = :id
ORDER BY v.id DESC;
