CREATE TABLE datasources (
       id uuid PRIMARY KEY,
       kind text NOT NULL,
       spec jsonb NOT NULL,
       ts timestamptz DEFAULT now()
);
--;

GRANT ALL ON datasources to dash;
--;
