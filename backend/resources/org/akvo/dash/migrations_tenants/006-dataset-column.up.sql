CREATE TABLE dataset_column (
  id TEXT PRIMARY KEY,
  dataset_id TEXT REFERENCES dataset,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  -- The name of the column in the data table
  column_name TEXT NOT NULL,
  column_order SMALLINT NOT NULL,
  sort SMALLINT,
  direction CHAR(1),
  hidden BOOLEAN,
  created TIMESTAMPTZ DEFAULT now(),
  modified TIMESTAMPTZ DEFAULT now()
);

GRANT ALL ON dataset_column to dash;

CREATE TABLE history.dataset_column (
  LIKE public.dataset_column,
  _validrange tstzrange NOT NULL
);

GRANT ALL ON history.dataset_column to dash;

ALTER TABLE ONLY history.dataset_column
ADD CONSTRAINT dataset_column_exclusion EXCLUDE
USING gist (id WITH =, _validrange WITH &&);

CREATE TRIGGER dataset_column_history BEFORE
INSERT OR DELETE OR UPDATE ON dataset_column
FOR EACH ROW EXECUTE PROCEDURE history.log_change();
