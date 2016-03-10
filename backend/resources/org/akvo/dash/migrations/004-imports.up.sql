CREATE TABLE imports (
       id SERIAL PRIMARY KEY,
       datasource uuid references datasources(id),
       revision text references revisions(digest),
       status text DEFAULT 'PENDING',
       note text DEFAULT '',
       ts timestamptz DEFAULT now()
);
--;

GRANT ALL ON imports to dash;
--;
