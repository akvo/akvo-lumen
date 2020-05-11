CREATE TABLE environment (
    id text PRIMARY KEY,
    "value" jsonb NOT NULL,
    created timestamptz NOT NULL DEFAULT now(),
    modified timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
    PERFORM tardis('environment');
    PERFORM install_update_modified('environment');
END$$;
--;;
