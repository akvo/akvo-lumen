CREATE TABLE materialized_map_view (
   id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
   view_id text,
   point_dataset_id text REFERENCES dataset(id) ON DELETE CASCADE,
   point_dataset_column text,
   point_dataset_modified timestamptz,
   shape_dataset_id text REFERENCES dataset(id) ON DELETE CASCADE,
   shape_dataset_column text,
   shape_dataset_modified timestamptz
);

DO $$
BEGIN
    PERFORM tardis('materialized_map_view');
    PERFORM install_update_modified('materialized_map_view');
END$$;
