CREATE TABLE data_source (
    id text PRIMARY KEY,
    spec jsonb NOT NULL,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now()
);

DO $$
BEGIN
    PERFORM tardis('data_source');
END$$;
-- ;;

CREATE TRIGGER data_source_modified
BEFORE UPDATE ON data_source
FOR EACH ROW EXECUTE PROCEDURE update_modified();
--;;
