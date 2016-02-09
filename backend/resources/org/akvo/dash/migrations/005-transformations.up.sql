CREATE TABLE transformations (
       id uuid PRIMARY KEY,
       fns jsonb,
       ts timestamptz DEFAULT now()
);
--;

GRANT ALL ON transformations to dash;
--;
