CREATE TABLE IF NOT EXISTS history.datasources (
    id text NOT NULL,
    spec jsonb NOT NULL,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now(),
    _validrange tstzrange NOT NULL
);

GRANT ALL ON history.datasources to dash;

ALTER TABLE ONLY history.datasources
ADD CONSTRAINT datasources_exclusion EXCLUDE
USING gist (id WITH =, _validrange WITH &&);
--;;


CREATE TABLE IF NOT EXISTS datasources (
    id text PRIMARY KEY,
    spec jsonb NOT NULL,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now()
);

GRANT ALL ON datasources to dash;

CREATE TRIGGER datasources_history BEFORE
INSERT OR DELETE OR UPDATE ON datasources
FOR EACH ROW EXECUTE PROCEDURE history.log_change();
--;;
