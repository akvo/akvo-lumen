CREATE TABLE IF NOT EXISTS history.tenants (
    id serial,
    db_uri text,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    label text,
    title text,
    _validrange tstzrange NOT NULL
);

GRANT ALL ON history.tenants to dash;

ALTER TABLE ONLY history.tenants
ADD CONSTRAINT tenants_exclusion EXCLUDE
USING gist (id WITH =, _validrange WITH &&);
--;;


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
