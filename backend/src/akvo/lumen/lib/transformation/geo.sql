-- :name add-geometry-column :?
-- :doc Creates a PostGIS geometry column
SELECT AddGeometryColumn (:table-name, :column-name-geo, 4326, 'POINT', 2)

-- :name generate-geopoints :!
-- :doc Populates the given PostGIS geometry column from the given latitude and longitude columns
UPDATE :i:table-name
SET :i:column-name-geo = ST_SetSRID(ST_MakePoint(:i:column-name-long, :i:column-name-lat), 4326)
