CREATE TABLE dataset (
id uuid PRIMARY KEY,
-- dataset_name text NOT NULL,
datasource uuid references datasources(id) NOT NULL,
transformation uuid references transformations(id) NOT NULL,
-- enabled BOOLEAN NOT NULL DEFAULT TRUE,
ts timestamptz DEFAULT now()
);
--;

GRANT ALL ON dataset to dash;
--;

CREATE TABLE dataset_meta (
       id uuid PRIMARY KEY,
       dataset uuid references dataset(id) NOT NULL,
       dataset_name text NOT NULL,
       enabled BOOLEAN NOT NULL DEFAULT TRUE,
       author jsonb,
       ts timestamptz DEFAULT now()
);
--;
GRANT ALL ON dataset_meta to dash;
--;
