CREATE TABLE dataset (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text DEFAULT '' NOT NULL,
  transaction_log jsonb DEFAULT '[]'::jsonb NOT NULL,
  created timestamptz DEFAULT now() NOT NULL,
  modified timestamptz DEFAULT now() NOT NULL
);

GRANT ALL ON dataset to dash;

CREATE TABLE history.dataset (
  LIKE public.dataset,
  _validrange tstzrange NOT NULL
);

GRANT ALL ON history.dataset to dash;

ALTER TABLE ONLY history.dataset
ADD CONSTRAINT dataset_exclusion EXCLUDE
USING gist (id WITH =, _validrange WITH &&);

CREATE TRIGGER dataset_history BEFORE
INSERT OR DELETE OR UPDATE ON dataset
FOR EACH ROW EXECUTE PROCEDURE history.log_change();
