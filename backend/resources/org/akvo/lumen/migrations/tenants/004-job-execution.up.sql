CREATE TABLE job_execution (
    id text PRIMARY KEY,
    data_source_id text REFERENCES data_source ON DELETE CASCADE,
    dataset_id text REFERENCES dataset ON DELETE CASCADE,
    type text NOT NULL,
    execution_log jsonb,
    error_log jsonb,
    status text NOT NULL DEFAULT 'PENDING',
    created timestamptz NOT NULL DEFAULT now(),
    modified timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
    PERFORM tardis('job_execution');
    PERFORM install_update_modified('job_execution');
END$$;
-- ;;
