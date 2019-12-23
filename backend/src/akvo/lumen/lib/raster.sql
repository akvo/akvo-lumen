-- :name all-rasters :? :*
WITH
failed_imports AS (
  SELECT j.id, d.spec->>'name' AS name, j.error_log->>0 AS error_log, j.status, j.created, j.modified, '{}'::jsonb AS metadata, '{}'::jsonb AS author, '{}'::jsonb AS source
    FROM data_source d, job_execution j
   WHERE j.data_source_id = d.id
     AND j.type = 'IMPORT'
     AND j.status = 'FAILED'
     AND d.spec->'source'->>'kind' = 'GEOTIFF'
),
pending_imports AS (
  SELECT j.id, d.spec->>'name' AS name, j.status, j.created, j.modified, '{}'::jsonb AS metadata, '{}'::jsonb AS author, '{}'::jsonb AS source
    FROM data_source d, job_execution j
   WHERE j.data_source_id = d.id
     AND j.type = 'IMPORT'
     AND j.status = 'PENDING'
     AND d.spec->'source'->>'kind' = 'GEOTIFF'
)
SELECT id, name, error_log as reason, status, created, modified, metadata, '{}'::jsonb AS author, '{}'::jsonb AS source
  FROM failed_imports
 UNION
SELECT id, name, NULL, status, created, modified, metadata, '{}'::jsonb AS author, '{}'::jsonb AS source
  FROM pending_imports
 UNION
SELECT id, title, NULL, 'OK', created, modified, metadata, author, source
  FROM raster_dataset;

-- :name insert-raster :! :n
-- :doc Insert new raster dataset
INSERT INTO raster_dataset (id, title, description, job_execution_id, raster_table, metadata, author, source)
VALUES (
       :id,
       :title,
       :description,
       :job-execution-id,
       :raster-table,
       :metadata,
       (SELECT jsonb_object_agg(key, value) FROM jsonb_each(:author) WHERE key IN ('name', 'given_name', 'family_name', 'email')),
       :source
);

-- :name create-raster-table :!
-- :doc Creates a raster table
CREATE TABLE :i:table-name (
 rid serial PRIMARY KEY,
 rast raster,
 filename text);

-- :name create-raster-index :!
-- :doc Adds an index on `rast` column for a given table
CREATE INDEX ON :i:table-name USING gist (st_convexhull("rast"));

-- :name add-raster-constraints :!
-- :doc Add more constraints on `rast` column for a given table
SELECT AddRasterConstraints(:table-name::name,'rast'::name);

-- :name raster-count :? :1
-- :doc returns the count of elements in a raster table
SELECT COUNT(*) AS c FROM :i:table-name;


-- :name raster-by-id :? :1
-- :doc Returns a raster table by id
SELECT * FROM raster_dataset WHERE id = :id;

-- :name vacuum-raster-table :!
-- :doc Executes VACUUM on a table - https://www.postgresql.org/docs/9.6/static/sql-vacuum.html
VACUUM ANALYZE :i:table-name;

-- :name raster-stats :? :1
-- :doc selects count,sum,mean,stddev,min,max
SELECT stats.count, stats.sum, stats.mean, stats.stddev, stats.min, stats.max
  FROM ST_SummaryStats(:table-name::name, 'rast'::name, 1, true) AS stats;

-- :name delete-raster-by-id :! :n
-- :doc delete raster
DELETE FROM raster_dataset WHERE id=:id;


-- :name delete-raster-columns :! :n
-- :doc delete from raster columns
DELETE FROM raster_columns WHERE r_table_name=:table-name;

-- :name drop-raster-table :!
-- :doc delete raster table
DROP TABLE IF EXISTS :i:table-name;
