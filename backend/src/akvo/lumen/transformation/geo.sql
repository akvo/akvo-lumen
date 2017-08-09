-- :name add-geometry-column :?
-- :doc Creates a PostGIS geometry column (identifiers must be quoted)
SELECT AddGeometryColumn (:i:table-name, :i:column-name-geo, 4326, 'POINT', 2)

-- :name generate-geopoints :!
-- :doc Populates the given PostGIS geometry column from the given latitude and longitude columns
UPDATE :i:table-name
SET :i:column-name-geo = ST_SetSRID(ST_MakePoint(:i:column-name-long, :i:column-name-long), 4326)
