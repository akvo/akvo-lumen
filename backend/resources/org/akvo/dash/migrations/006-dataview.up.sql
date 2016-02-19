CREATE TABLE dataview (
       id uuid PRIMARY KEY,
       dataset_name text NOT NULL,
       datasource uuid references datasources(id) NOT NULL,
       transformation uuid references transformations(id) NOT NULL,
       enabled BOOLEAN NOT NULL DEFAULT TRUE,
       ts timestamptz DEFAULT now()
);
--;

GRANT ALL ON dataview to dash;
--;
