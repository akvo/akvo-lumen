CREATE TABLE IF NOT EXISTS visualisation (
    id text NOT NULL,
    "name" text NOT NULL,
    spec jsonb,
    author jsonb,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now()
);


DO $$
BEGIN
    PERFORM tardis('visualisation');
END$$;
--;;

CREATE TRIGGER visualisation_modified
BEFORE UPDATE ON visualisation
FOR EACH ROW EXECUTE PROCEDURE update_modified();
--;;
