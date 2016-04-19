CREATE TABLE IF NOT EXISTS dataset (
       id text PRIMARY KEY,
       "name" text NOT NULL,
       d jsonb,
       datasource text REFERENCES datasource(id) NOT NULL,
       status text DEFAULT 'PENDING',
       author jsonb,
       enabled BOOLEAN NOT NULL DEFAULT TRUE,
       created timestamptz DEFAULT now(),
       modified timestamptz DEFAULT now()
);

GRANT ALL ON dataset TO dash;

CREATE TRIGGER dataset_history BEFORE
INSERT OR DELETE OR UPDATE ON dataset
FOR EACH ROW EXECUTE PROCEDURE history.log_change();
--;;



CREATE TABLE IF NOT EXISTS history.dataset (
       LIKE public.dataset,
       _validrange tstzrange NOT NULL
);

GRANT ALL ON history.dataset TO dash;

ALTER TABLE ONLY history.dataset
ADD CONSTRAINT dataset_exclusion EXCLUDE
USING gist (id WITH =, _validrange WITH &&);
--;;
