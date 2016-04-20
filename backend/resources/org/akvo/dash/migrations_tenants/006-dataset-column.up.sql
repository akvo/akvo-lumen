CREATE TABLE dataset_column (
  id text PRIMARY KEY,
  dataset_id text REFERENCES dataset,
  title text NOT NULL,
  type text NOT NULL,
  -- The name of the column in the data table
  column_name text NOT NULL,
  column_order smallint NOT NULL,
  sort smallint,
  direction char(1),
  hidden boolean,
  created timestamptz DEFAULT now(),
  modified timestamptz DEFAULT now()
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
