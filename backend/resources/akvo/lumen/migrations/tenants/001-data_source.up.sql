CREATE TABLE data_source (
    id text PRIMARY KEY,
    spec jsonb NOT NULL,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now()
);

DO $$
BEGIN
    PERFORM tardis('data_source');
    PERFORM install_update_modified('data_source');
END$$;
-- ;;
