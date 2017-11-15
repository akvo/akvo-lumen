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
