-- :name dataset-coll :? :*
-- :doc returns the dataset collection
SELECT q.dataset_id AS id, q.dataset_name AS "name", q.status,
       q.dataset_ts AS created,
       GREATEST(q.import_ts, q.dataset_ts, q.meta_ts, q.transformation_ts) AS modified
FROM (
     SELECT DISTINCT ON (ds.id)
     ds.id AS dataset_id, m.dataset_name, j.status,
     j.ts AS import_ts, ds.ts AS dataset_ts, m.ts AS meta_ts, tf.ts AS transformation_ts
     FROM dataset ds
     LEFT JOIN (
          SELECT DISTINCT ON (dsm.dataset)
          dsm.id, dsm.dataset_name, dsm.dataset, dsm.ts
          FROM dataset_meta dsm
          ORDER BY dsm.dataset, dsm.id DESC) m ON ds.id = m.dataset
     LEFT JOIN (
         SELECT DISTINCT ON (t.dataset)
         t.id, t.fns, t.dataset, t.ts
         FROM transformations t
         ORDER BY t.dataset, t.id DESC) tf ON ds.id = tf.dataset
     LEFT JOIN datasources s ON ds.datasource = s.id
     LEFT JOIN (
          SELECT DISTINCT ON (i.datasource)
          i.id, i.datasource, i.revision, i.status, i.ts, r.noble
          FROM imports i LEFT JOIN revisions r ON i.revision = r.digest
          ORDER BY i.datasource, i.id DESC) j ON s.id = j.datasource
     ORDER BY ds.id DESC) q


-- :name insert-transformation :! :n
-- :doc Insert a transformation
INSERT INTO transformations (id, dataset, fns)
VALUES (:id, :dataset, :fns::jsonb)


-- :name insert-datasource :! :n
-- :doc Insert a single datasource returning affected row count
insert into datasources (id, kind, spec)
values (:id, :kind, :spec::jsonb)


-- :name insert-dataset :! :n
-- :Insert a single dataset
INSERT INTO dataset (id, datasource)
VALUES (:id, :datasource)


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
SELECT DISTINCT ON (ds.id)
ds.id AS id, s.id AS datasource_id, m.dataset_name AS name,
i.status, i.digest, i.noble, tf.id AS transformation_id, tf.fns AS transformations
FROM dataset ds
LEFT JOIN (
     SELECT DISTINCT ON (dsm.dataset)
     dsm.id, dsm.dataset_name, dsm.dataset
     FROM dataset_meta dsm
     ORDER BY dsm.dataset, dsm.id DESC) m ON ds.id = m.dataset
LEFT JOIN (
     SELECT DISTINCT ON (t.dataset)
     t.id, t.fns, t.dataset
     FROM transformations t
     ORDER BY t.dataset, t.id DESC) tf ON ds.id = tf.dataset
LEFT JOIN datasources s ON ds.datasource = s.id
LEFT JOIN (
     SELECT DISTINCT ON (i.datasource)
     i.id, i.datasource, i.status, i.revision, r.noble, r.digest
     FROM imports i LEFT JOIN revisions r ON i.revision = r.digest
     ORDER BY i.datasource, i.id DESC) i ON s.id = i.datasource
-- transformations
WHERE ds.id = :id;
