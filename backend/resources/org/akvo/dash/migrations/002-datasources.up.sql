CREATE TABLE datasources (
       id text PRIMARY KEY,
       kind text NOT NULL,
       -- spec jsonb NOT NULL,
       spec jsonb,
       ts timestamptz DEFAULT now()
);
--;

GRANT ALL ON datasources to dash;
--;
