CREATE TABLE IF NOT EXISTS tenant (
       id serial,
       db_uri text,
       enabled BOOLEAN NOT NULL DEFAULT TRUE,
       label text,
       title text
);

GRANT ALL ON tenant TO dash;

CREATE TRIGGER tenant_history BEFORE
INSERT OR DELETE OR UPDATE ON tenant
FOR EACH ROW EXECUTE PROCEDURE history.log_change();


--;;
CREATE TABLE IF NOT EXISTS history.tenant (
       LIKE public.tenant,
       _validrange tstzrange NOT NULL
);

GRANT ALL ON tenant TO dash;

ALTER TABLE ONLY history.tenant
ADD CONSTRAINT tenant_exclusion EXCLUDE
USING gist (id WITH =, _validrange WITH &&);
--;;
