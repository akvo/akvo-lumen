CREATE TABLE job_execution (
  id text PRIMARY KEY,
  data_source_id text REFERENCES data_source,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  error_reason text,
  created timestamptz DEFAULT now(),
  modified timestamptz DEFAULT now()
);

GRANT ALL ON job_execution to dash;

CREATE TABLE history.job_execution (
  LIKE public.job_execution,
  _validrange tstzrange NOT NULL
);

GRANT ALL ON history.job_execution to dash;

ALTER TABLE ONLY history.job_execution
ADD CONSTRAINT job_execution_exclusion EXCLUDE
USING gist (id WITH =, _validrange WITH &&);

CREATE TRIGGER job_execution_history BEFORE
INSERT OR DELETE OR UPDATE ON job_execution
FOR EACH ROW EXECUTE PROCEDURE history.log_change();
