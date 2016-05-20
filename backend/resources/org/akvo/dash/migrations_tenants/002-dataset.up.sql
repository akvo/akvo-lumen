CREATE TABLE dataset (
    id text PRIMARY KEY,
    title text NOT NULL,
    description text DEFAULT '' NOT NULL,
    transformations jsonb DEFAULT '[]'::jsonb NOT NULL,
    created timestamptz DEFAULT now() NOT NULL,
    modified timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
    PERFORM tardis('dataset');
    PERFORM install_update_modified('dataset');
END$$;
--;;
