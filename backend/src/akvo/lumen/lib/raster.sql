-- :name all-rasters :? :*
WITH
failed_imports AS (
  SELECT j.id, d.spec->>'name' AS name, j.error_log->>0 AS error_log, j.status, j.created, j.modified
    FROM data_source d, job_execution j
   WHERE j.data_source_id = d.id
     AND j.type = 'IMPORT'
     AND j.status = 'FAILED'
     AND d.spec->'source'->>'kind' = 'GEOTIFF'
),
pending_imports AS (
  SELECT j.id, d.spec->>'name' AS name, j.status, j.created, j.modified
    FROM data_source d, job_execution j
   WHERE j.data_source_id = d.id
     AND j.type = 'IMPORT'
     AND j.status = 'PENDING'
     AND d.spec->'source'->>'kind' = 'GEOTIFF'
)
SELECT id, name, error_log as reason, status, modified, created
  FROM failed_imports
 UNION
SELECT id, name, NULL, status, modified, created
  FROM pending_imports
 UNION
SELECT id, title, NULL, 'OK', modified, created
  FROM raster_dataset;

-- :name insert-raster :! :n
-- :doc Insert new raster dataset
INSERT INTO raster_dataset (id, title, description, job_execution_id, raster_table)
VALUES (:id, :title, :description, :job-execution-id, :raster-table);

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
SELECT AddRasterConstraints('',:table-name,'rast',TRUE,TRUE,TRUE,TRUE,TRUE,TRUE,FALSE,TRUE,TRUE,TRUE,TRUE,TRUE);

-- :name raster-count :? :1
-- :doc returns the count of elements in a raster table
SELECT COUNT(*) AS c FROM :i:table-name;


-- :name raster-by-id :? :1
-- :doc Returns a raster table by id
SELECT * FROM raster_dataset WHERE id = :id
