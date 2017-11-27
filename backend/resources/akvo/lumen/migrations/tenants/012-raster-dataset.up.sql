CREATE TABLE raster_dataset (
    id text PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL DEFAULT '',
    raster_table text NOT NULL,
    created timestamptz NOT NULL DEFAULT now(),
    modified timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
    PERFORM tardis('raster_dataset');
    PERFORM install_update_modified('raster_dataset');
END$$;
--;;
