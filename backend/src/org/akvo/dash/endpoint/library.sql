-- :name all-datasets :? :*
-- :doc returns the dataset collection
SELECT id, name, datasource, status, created, modified
FROM datasets;

-- :name yank-tables :? :*
SELECT table_schema,table_name
FROM information_schema.tables
ORDER BY table_schema,table_name;

-- :name yank-dbs :? :*
SELECT datname FROM pg_database
WHERE datistemplate = false;

-- :name yank-db :? :*
SELECT current_database();

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
