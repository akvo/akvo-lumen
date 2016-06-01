CREATE TABLE IF NOT EXISTS visualisation (
    id text PRIMARY KEY,
    dataset_id text REFERENCES dataset ON DELETE CASCADE,
    "name" text NOT NULL,
    type text NOT NULL,
    spec jsonb NOT NULL,
    author jsonb,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now()
);


DO $$
BEGIN
    PERFORM tardis('visualisation');
    PERFORM install_update_modified('visualisation');
END$$;
--;;
