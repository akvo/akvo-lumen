CREATE TABLE dataset (
    id text PRIMARY KEY,
    title text NOT NULL,
    description text DEFAULT '' NOT NULL,
    transaction_log jsonb DEFAULT '[]'::jsonb NOT NULL,
    created timestamptz DEFAULT now() NOT NULL,
    modified timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
    PERFORM tardis('dataset');
END$$;
--;;

CREATE TRIGGER dataset_modified
BEFORE UPDATE ON dataset
FOR EACH ROW EXECUTE PROCEDURE update_modified();
--;;
