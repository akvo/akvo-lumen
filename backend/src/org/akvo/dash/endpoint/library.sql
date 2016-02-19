-- :name dataset-coll :? :*
-- :doc returns the dataset collection
SELECT ds.view_id AS dataset_id, ds.dataset_name, ds.status,
ds.view_ts AS created,
GREATEST(ds.trans_ts, ds.import_ts, ds.view_ts) AS modified
FROM (
     SELECT DISTINCT ON (v.id)
     v.id AS view_id, v.dataset_name, j.status, t.id AS transformation_id,
     t.ts AS trans_ts, j.ts AS import_ts, v.ts AS view_ts
     FROM dataview v
     LEFT JOIN datasources s ON v.datasource = s.id
     LEFT JOIN transformations t ON v.transformation = t.id
     LEFT JOIN (
          SELECT DISTINCT ON (i.datasource)
          i.id, i.datasource, i.revision, i.status, i.ts, r.noble
          FROM imports i LEFT JOIN revisions r ON i.revision = r.digest
          ORDER BY i.datasource, i.id DESC) j ON s.id = j.datasource
     ORDER BY v.id DESC) ds


-- SELECT a.view_id, a.dataset_name, a.status, GREATEST(a.trans_ts, a.import_ts, a.view_ts) AS last_modified, a.view_ts AS created
-- FROM (
--      SELECT DISTINCT ON (v.id)
--      v.id AS view_id, v.dataset_name, j.status, t.id AS transformation_id, t.ts AS trans_ts, j.ts AS import_ts, v.ts AS view_ts
--      FROM dataview v
--      LEFT JOIN datasources s ON v.datasource = s.id
--      LEFT JOIN transformations t ON v.transformation = t.id
--      LEFT JOIN (
--           SELECT DISTINCT ON (i.datasource)
--           i.id, i.datasource, i.revision, i.status, i.ts, r.noble
--           FROM imports i LEFT JOIN revisions r ON i.revision = r.digest
--           ORDER BY i.datasource, i.id DESC) j ON s.id = j.datasource
--      ORDER BY v.id DESC) a
