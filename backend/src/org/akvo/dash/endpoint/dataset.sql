-- :name dataset-coll :? :*
-- :doc returns the dataset collection
SELECT q.view_id AS id, q.dataset_name AS "name", q.status,
       q.view_ts AS created,
       GREATEST(q.trans_ts, q.import_ts, q.view_ts, q.meta_ts) AS modified
FROM (
     SELECT DISTINCT ON (ds.id)
     ds.id AS view_id, dsm.dataset_name, j.status, t.id AS transformation_id,
     t.ts AS trans_ts, j.ts AS import_ts, ds.ts AS view_ts, dsm.ts AS meta_ts
     FROM dataset ds
     LEFT JOIN datasources s ON ds.datasource = s.id
     LEFT JOIN transformations t ON ds.transformation = t.id -- n?
     LEFT JOIN dataset_meta dsm ON dsm.dataset = ds.id
     LEFT JOIN (
          SELECT DISTINCT ON (i.datasource)
          i.id, i.datasource, i.revision, i.status, i.ts, r.noble
          FROM imports i LEFT JOIN revisions r ON i.revision = r.digest
          ORDER BY i.datasource, i.id DESC) j ON s.id = j.datasource
     ORDER BY ds.id DESC) q


-- :name insert-transformation :! :n
-- :doc Insert a transformation
INSERT INTO transformations (id, fns)
VALUES (:id, :fns::jsonb)

-- :name insert-datasource :! :n
-- :doc Insert a single datasource returning affected row count
insert into datasources (id, kind, spec)
values (:id, :kind, :spec::jsonb)


-- :name insert-dataset :! :n
-- :Insert a single dataset
INSERT INTO dataset (id, datasource, transformation)
VALUES (:id, :datasource, :transformation)


-- :name insert-dataset_meta :! :n
-- :Insert a single dataset
INSERT INTO dataset_meta (id, dataset, dataset_name)
VALUES (:id, :dataset, :dataset_name)

-- :name insert-import :? :1
-- :doc Insert a single import
INSERT INTO imports (id, datasource) -- add data-source
VALUES (DEFAULT, :datasource)
RETURNING id;

-- Think dataset-by-id is broken in dataset_name

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
