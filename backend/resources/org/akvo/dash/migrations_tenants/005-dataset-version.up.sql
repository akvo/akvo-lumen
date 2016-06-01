CREATE TABLE dataset_version (
    id text PRIMARY KEY,
    dataset_id text NOT NULL REFERENCES dataset ON DELETE CASCADE,
    job_execution_id text NOT NULL REFERENCES job_execution ON DELETE CASCADE,
    transformations jsonb NOT NULL DEFAULT '[]'::jsonb,
    version smallint NOT NULL,
    -- The name of the data table
    table_name text UNIQUE NOT NULL,
    -- The name of the data table that holds imported (non-transformed) data
    imported_table_name text NOT NULL,
    columns jsonb NOT NULL DEFAULT '[]'::jsonb,
    created timestamptz NOT NULL DEFAULT now(),
    modified timestamptz NOT NULL DEFAULT now(),
    UNIQUE (dataset_id, version)
);

DO $$
BEGIN
    PERFORM tardis('dataset_version');
    PERFORM install_update_modified('dataset_version');
END$$;
-- ;;
