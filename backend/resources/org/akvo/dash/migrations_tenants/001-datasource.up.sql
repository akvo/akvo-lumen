CREATE TABLE IF NOT EXISTS datasource (
       id text PRIMARY KEY,
       spec jsonb NOT NULL,
       created timestamptz DEFAULT now(),
       modified timestamptz DEFAULT now()
);

GRANT ALL ON datasource TO dash;

CREATE TRIGGER datasource_history BEFORE
INSERT OR DELETE OR UPDATE ON datasource
FOR EACH ROW EXECUTE PROCEDURE history.log_change();
--;;


CREATE TABLE IF NOT EXISTS history.datasource (
       LIKE public.datasource,
       _validrange tstzrange NOT NULL
);

GRANT ALL ON history.datasource TO dash;

ALTER TABLE ONLY history.datasource
ADD CONSTRAINT datasource_exclusion EXCLUDE
USING gist (id WITH =, _validrange WITH &&);
--;;
