CREATE TABLE transformations (
       id uuid PRIMARY KEY,
       dataset uuid references dataset(id) NOT NULL,
       fns jsonb,
       ts timestamptz DEFAULT now()
);
--;

GRANT ALL ON transformations to dash;
--;
