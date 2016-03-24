SET search_path = history, pg_catalog;
CREATE TABLE IF NOT EXISTS tenants (
    id serial,
    db_uri text,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    label text,
    title text,
    _validrange tstzrange
);

GRANT ALL ON tenants to dash;

ALTER TABLE ONLY tenants
ADD CONSTRAINT tenants_exclusion EXCLUDE
USING gist (id WITH =, _validrange WITH &&);
--;;

SET search_path = public, pg_catalog;

CREATE TABLE IF NOT EXISTS tenants (
    id serial,
    db_uri text,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    label text,
    title text
);

GRANT ALL ON tenants to dash;

CREATE TRIGGER tenants_history BEFORE
INSERT OR DELETE OR UPDATE ON tenants
FOR EACH ROW EXECUTE PROCEDURE history.log_change();
--;;
