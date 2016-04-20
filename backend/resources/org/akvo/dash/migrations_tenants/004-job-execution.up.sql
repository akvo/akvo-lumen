CREATE TABLE job_execution (
  id TEXT PRIMARY KEY,
  data_source_id TEXT REFERENCES data_source,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  error_reason TEXT,
  created TIMESTAMPTZ DEFAULT now(),
  modified TIMESTAMPTZ DEFAULT now()
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
