CREATE TABLE job_execution (
    id text PRIMARY KEY,
    data_source_id text REFERENCES data_source,
    started_at timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz,
    error_reason text,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now()
);

DO $$
BEGIN
    PERFORM tardis('job_execution');
END$$;
-- ;;
