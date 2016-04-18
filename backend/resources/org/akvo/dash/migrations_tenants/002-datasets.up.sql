CREATE TABLE IF NOT EXISTS history.datasets (
    id text NOT NULL,
    "name" text NOT NULL,
    d jsonb,
    datasource text NOT NULL,
    status text DEFAULT 'PENDING',
    author jsonb,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now(),
    _validrange tstzrange NOT NULL
);

GRANT ALL ON history.datasets to dash;

ALTER TABLE ONLY history.datasets
ADD CONSTRAINT datasets_exclusion EXCLUDE
USING gist (id WITH =, _validrange WITH &&);
--;;


CREATE TABLE IF NOT EXISTS datasets (
    id text PRIMARY KEY,
    "name" text NOT NULL,
    d jsonb,
    datasource text references datasources(id) NOT NULL,
    status text DEFAULT 'PENDING',
    author jsonb,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created timestamptz DEFAULT now(),
    modified timestamptz DEFAULT now()
);

GRANT ALL ON datasets to dash;

CREATE TRIGGER datasets_history BEFORE
INSERT OR DELETE OR UPDATE ON datasets
FOR EACH ROW EXECUTE PROCEDURE history.log_change();
--;;
