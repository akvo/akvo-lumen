CREATE TABLE dataset_version_2 (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    dataset_id text NOT NULL REFERENCES dataset ON DELETE CASCADE,
    job_execution_id text NOT NULL REFERENCES job_execution ON DELETE CASCADE,
    transformations jsonb NOT NULL DEFAULT '[]'::jsonb,
    version smallint NOT NULL,
    author jsonb NOT NULL,
    created timestamptz NOT NULL DEFAULT now(),
    modified timestamptz NOT NULL DEFAULT now(),
    UNIQUE (dataset_id, version)
);
--;;
CREATE TABLE data_group (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    group_id text NOT NULL,
    group_name text NOT NULL,
    dataset_version_id text NOT NULL REFERENCES dataset_version_2 ON DELETE CASCADE,
    table_name text NOT NULL,
    imported_table_name text NOT NULL,
    columns jsonb NOT NULL,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now(),
    UNIQUE(dataset_version_id, group_id)
);
--;;

DO $$
BEGIN
    PERFORM tardis('dataset_version_2');
    PERFORM install_update_modified('dataset_version_2');
    PERFORM tardis('data_group');
    PERFORM install_update_modified('data_group');
END$$;
--;;
