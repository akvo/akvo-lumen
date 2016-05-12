CREATE TABLE dataset_version (
    id text PRIMARY KEY,
    dataset_id text REFERENCES dataset,
    job_execution_id text REFERENCES job_execution,
    version smallint NOT NULL,
    -- The name of the data table
    table_name text UNIQUE NOT NULL,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now(),
    UNIQUE (dataset_id, version)
);

DO $$
BEGIN
    PERFORM tardis('dataset_version');
END$$;
-- ;;

CREATE TRIGGER dataset_version_modified
BEFORE UPDATE ON dataset_version
FOR EACH ROW EXECUTE PROCEDURE update_modified();
--;;
