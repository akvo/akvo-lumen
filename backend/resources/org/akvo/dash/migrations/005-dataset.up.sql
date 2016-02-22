CREATE TABLE dataset (
       id uuid PRIMARY KEY,
       datasource uuid references datasources(id) NOT NULL,
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
