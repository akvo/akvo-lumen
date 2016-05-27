CREATE TABLE job_execution (
    id text PRIMARY KEY,
    data_source_id text REFERENCES data_source ON DELETE CASCADE,
    dataset_id text REFERENCES dataset ON DELETE CASCADE,
    type text NOT NULL,
    log text,
    created timestamptz NOT NULL DEFAULT now(),
    modified timestamptz
);

DO $$
BEGIN
    PERFORM tardis('job_execution');
    PERFORM install_update_modified('job_execution');
END$$;
-- ;;
