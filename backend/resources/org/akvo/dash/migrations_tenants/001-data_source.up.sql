CREATE TABLE data_source (
  id text PRIMARY KEY,
  spec jsonb NOT NULL,
  created timestamptz DEFAULT now(),
  modified timestamptz DEFAULT now()
);

GRANT ALL ON data_source to dash;

CREATE TABLE history.data_source (
  LIKE public.data_source,
  _validrange tstzrange NOT NULL
);

GRANT ALL ON history.data_source to dash;

ALTER TABLE ONLY history.data_source
ADD CONSTRAINT datasources_exclusion EXCLUDE
USING gist (id WITH =, _validrange WITH &&);

CREATE TRIGGER data_sources_history BEFORE
INSERT OR DELETE OR UPDATE ON data_source
FOR EACH ROW EXECUTE PROCEDURE history.log_change();
