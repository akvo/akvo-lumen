-- :name all-datasets :? :*
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


-- :name all-visualisations :? :*
-- :doc All visualisations
SELECT v.id, vd.name, v.ts AS created, vd.ts AS modified
FROM visualisation v
LEFT JOIN (
     SELECT DISTINCT ON (v_data.visualisation)
     v_data.name, v_data.visualisation, v_data.spec, v_data.enabled, v_data.ts
     FROM visualisation_data v_data
     ORDER BY v_data.visualisation, v_data.id DESC) vd ON v.id = vd.visualisation
WHERE vd.enabled = 'true';
