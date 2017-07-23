-- :name add-geometry-column :!
/* :doc Adds a PostGIS geometry column for the given table
        from the given longitude and latitude columns
*/
SELECT AddGeometryColumn (:i:table-name, 'geom', 4326, 'POINT', 2);
UPDATE :i:table-name SET geom = ST_MakePoint(:i:column-name-long, :i:column-name-lat);
