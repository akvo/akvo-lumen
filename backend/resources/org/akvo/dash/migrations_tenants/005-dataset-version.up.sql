CREATE TABLE dataset_version (
    id text PRIMARY KEY,
    dataset_id text REFERENCES dataset ON DELETE CASCADE,
    job_execution_id text REFERENCES job_execution ON DELETE CASCADE,
    version smallint NOT NULL,
    -- The name of the data table
    table_name text UNIQUE NOT NULL,
    columns jsonb NOT NULL DEFAULT '[]'::jsonb,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now(),
    UNIQUE (dataset_id, version)
);

DO $$
BEGIN
    PERFORM tardis('dataset_version');
    PERFORM install_update_modified('dataset_version');
END$$;
-- ;;
