-- :name dataset-coll :? :*
-- :doc returns the dataset collection
SELECT DISTINCT ON (v.id)
v.id AS view_id, v.dataset_name, j.status, j.ts AS modified, v.ts AS created
FROM dataview v
LEFT JOIN datasources s ON v.datasource = s.id
LEFT JOIN (
     SELECT DISTINCT ON (i.datasource)
     i.id, i.datasource, i.revision, i.status, i.ts, r.noble
     FROM imports i LEFT JOIN revisions r ON i.revision = r.digest
     ORDER BY i.datasource, i.id DESC) j ON s.id = j.datasource
ORDER BY v.id DESC
