CREATE TABLE dataset (
    id text PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL DEFAULT '',
    created timestamptz NOT NULL DEFAULT now(),
    modified timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
    PERFORM tardis('dataset');
    PERFORM install_update_modified('dataset');
END$$;
--;;
