CREATE TABLE visualisation (
       id uuid PRIMARY KEY,
       ts timestamptz DEFAULT now()
);
--;

GRANT ALL ON visualisation to dash;
--;


CREATE TABLE visualisation_data (
       id uuid PRIMARY KEY,
       visualisation uuid references visualisation(id) NOT NULL,
       name text NOT NULL,
       spec jsonb,
       enabled BOOLEAN NOT NULL DEFAULT TRUE,
       author jsonb,
       ts timestamptz DEFAULT now()
);
--;

GRANT ALL on visualisation_data to dash;
--;
