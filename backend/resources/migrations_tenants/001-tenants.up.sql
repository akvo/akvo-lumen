SET search_path = history, pg_catalog;
CREATE TABLE IF NOT EXISTS datasources (
    id text PRIMARY KEY,
    spec jsonb NOT NULL,
    -- ts timestamptz DEFAULT now()
    -- created ??
    -- modified ??
    _validrange tstzrange
);

GRANT ALL ON datasources to dash;

ALTER TABLE ONLY datasources
ADD CONSTRAINT datasources_exclusion EXCLUDE
USING gist (id WITH =, _validrange WITH &&);
--;;

SET search_path = public, pg_catalog;

CREATE TABLE IF NOT EXISTS datasources (
    id text PRIMARY KEY,
    spec jsonb NOT NULL
    -- ts timestamptz DEFAULT now()
    -- created ??
    -- modified ??
);

GRANT ALL ON datasources to dash;

CREATE TRIGGER datasources_history BEFORE
INSERT OR DELETE OR UPDATE ON datasources
FOR EACH ROW EXECUTE PROCEDURE history.log_change();
--;;
